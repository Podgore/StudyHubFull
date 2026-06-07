using Microsoft.AspNetCore.Identity;
using StudyHub.Common;
using StudyHub.Entities;
using StudyHub.Seeding.Interfaces;

namespace StudyHub.Seeding.Behaviours;

public class UsersSeedingBehaviour : ISeedingBehaviour
{
    private readonly UserManager<User> _userManager;

    public UsersSeedingBehaviour(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task SeedAsync()
    {
        var users = new List<(User user, string password, UserRole role)>
        {
            (
                new User { Email="admin@studyhub.com", EmailConfirmed=true, FullName = "admin", UserName = "admin@studyhub.com" },
                "Admin123!@#",
                UserRole.Admin
            ),
            (
                new User { Email="teacher@studyhub.com", EmailConfirmed=true, FullName = "teacher", UserName = "teacher@studyhub.com" },
                "Teacher123!@#",
                UserRole.Teacher
            ),
            (
                new User { Email="student@studyhub.com", EmailConfirmed=true, FullName = "student", UserName = "student@studyhub.com" },
                "Student123!@#",
                UserRole.Student
            )
        };

        foreach (var pair in users)
        {
            await _userManager.CreateAsync(pair.user, pair.password);
            var user = await _userManager.FindByEmailAsync(pair.user.Email!);
            await _userManager.AddToRoleAsync(user!, pair.role.ToString());
        }
    }
}