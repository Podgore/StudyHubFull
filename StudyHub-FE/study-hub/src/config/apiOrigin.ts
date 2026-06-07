const useGateway = process.env.REACT_APP_USE_GATEWAY === "1";

export const API_ORIGIN = useGateway
  ? ""
  : (process.env.REACT_APP_API_ORIGIN ?? "https://localhost:7019");
