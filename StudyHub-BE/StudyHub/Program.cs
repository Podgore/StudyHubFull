using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StudyHub.DependencyInjection;
using StudyHub.BLL.Profiles;
using StudyHub.BLL.Services;
using StudyHub.BLL.Services.Auth;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.BLL.Services.Interfaces.Auth;
using StudyHub.DAL.EF;
using StudyHub.DAL.Repositories;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;
using StudyHub.Extensions;
using StudyHub.FluentEmail.Services;
using StudyHub.FluentEmail.Services.Interfaces;
using StudyHub.Middlewares;
using StudyHub.Seeding.Extentions;
using StudyHub.Validators.AssignmentTaskOptionValidators;
using System.Text;
using Hangfire;
using StudyHub.Hangfire.Extensions;
using StudyHub.Common.Configs;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.Extensions.Options;
using StudyHub.Hangfire.Jobs;
using StudyHub.Services;
using StudyHub.Utility;
using StudyHub.BLL.Services.Interfaces.Assignment;
using StudyHub.BLL.Services.Assignments;
using Microsoft.OpenApi.Any;
using Microsoft.Extensions.FileProviders;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigsAssembly(builder.Configuration, opt => opt
       .AddConfig<JwtConfig>()
       .AddConfig<GoogleAuthConfig>()
       .AddConfig<EmailConfig>()
       .AddConfig<HangfireConfig>()
       .AddConfig<CallbackUrisConfig>()
       .AddConfig<UserInvitationConfig>()
       .AddConfig<AvatarConfig>()
       .AddConfig<LectureMaterialsConfig>()
       .AddConfig<TelegramConfig>());

builder.Services.AddAutoMapper(typeof(AssignmentTaskProfile));

builder.Services
    .AddControllers(cfg =>
    {
        cfg.Filters.Add(typeof(ExceptionFilter));
        cfg.Conventions.Add(new RouteTokenTransformerConvention(new SlugifyParameterTransformer()));
    })
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Hangfire
builder.Services.AddHangfire(builder.Configuration);

// Repository
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Service
builder.Services.AddScoped<ISubjectService, SubjectService>();
builder.Services.AddScoped<IAssignmentTaskService, AssignmentTaskService>();
builder.Services.AddScoped<IAssignmentService, AssignmentService>();
builder.Services.AddScoped<ITimedTestSessionService, TimedTestSessionService>();
builder.Services.AddScoped<IVariantService, VariantService>();
builder.Services.AddScoped<IOptionsService, OptionsService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserInvitationService, UserInvitationService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IEncryptService, EncryptService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IStudentAnswerService, StudentAnswerService>();
builder.Services.AddScoped<IOpenEndedGradingService, OpenEndedGradingService>();
builder.Services.AddScoped<IAssignmentAttachmentService, AssignmentAttachmentService>();
builder.Services.AddScoped<IHomeworkSubmissionService, HomeworkSubmissionService>();
builder.Services.AddScoped<ILectureMaterialService, LectureMaterialService>();
builder.Services.AddScoped<ILectureService, LectureService>();
builder.Services.AddScoped<IStudentGradesService, StudentGradesService>();

builder.Services.AddHttpClient("TelegramBotApi");
builder.Services.AddSingleton<global::Telegram.Bot.ITelegramBotClient>(sp =>
{
    var cfg = sp.GetRequiredService<IOptions<TelegramConfig>>().Value;
    var http = sp.GetRequiredService<IHttpClientFactory>().CreateClient("TelegramBotApi");
    return new global::Telegram.Bot.TelegramBotClient(cfg.BotToken ?? string.Empty, http);
});
builder.Services.AddScoped<INotificationSettingsService, NotificationSettingsService>();
builder.Services.AddStudyHubNotifications();
builder.Services.AddScoped<ClearingInvitedUsersJob>();
builder.Services.AddScoped<TelegramNotificationsJob>();
builder.Services.AddScoped<TelegramDailyDigestJob>();
builder.Services.AddHostedService<TelegramBotPollingHostedService>();

// Fluent Email
builder.Services.AddFluentEmail(builder.Configuration);

// Seeding
builder.Services.AddSeeding();

// Identity
builder.Services.AddIdentity<User, IdentityRole<Guid>>()
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddTokenProvider<DataProtectorTokenProvider<User>>(TokenOptions.DefaultProvider);

// Validators
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<CreateTaskOptionValidator>();
var tokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(key: Encoding.UTF8.GetBytes(builder.Configuration.GetValue<string>("JwtConfig:Secret")!)),
    ValidateIssuer = false,
    ValidateAudience = false,
    RequireExpirationTime = false,
    ValidateLifetime = true
};
builder.Services.AddAuthentication(configureOptions: x =>
    {
        x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        x.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(x =>
    {
        x.SaveToken = true;
        x.TokenValidationParameters = tokenValidationParameters;
    });

builder.Services.AddSingleton(tokenValidationParameters);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Standard Authorization header using the Bearer scheme. Example: \"bearer {token}\"",
        In = ParameterLocation.Header,
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        }
    );
    c.MapType<TimeSpan>(() => new OpenApiSchema
    {
        Type = "string",
        Example = new OpenApiString("00:00:00")
    });
});

// CORS
builder.Services.AddCors(options => options
    .AddDefaultPolicy(build => build
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader()));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MigrateDatabase();

await app.ApplySeedingAsync();
app.SetupHangfire();

app.UseHttpsRedirection();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "Uploads")),
    RequestPath = "/Uploads"
});
app.UseCors(
    opt => opt.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.UseHangfireDashboard("/hangfire");

app.Run();