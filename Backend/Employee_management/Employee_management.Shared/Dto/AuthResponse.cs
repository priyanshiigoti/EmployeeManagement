namespace Employee_management.Shared.Dto
{
    public class AuthResponse
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; }
        public string Token { get; set; }
        public Dictionary<string, string[]>? Errors { get; set; }  // new property
    }
}
