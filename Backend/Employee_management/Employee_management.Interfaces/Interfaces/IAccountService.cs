using System.Threading.Tasks;
using Employee_management.Shared.Dto;

namespace Employee_management.Interfaces.Interfaces
{
    public interface IAccountService
    {
        Task<AuthResponse> RegisterEmployeeAsync(UserRegistrationDto dto);
        Task<object> LoginAsync(LoginDto dto);
        Task<AuthResponse> ConfirmEmailAsync(string userId, string token);
        Task<AuthResponse> ForgotPasswordAsync(string email);
        Task<AuthResponse> ResetPasswordAsync(ResetPasswordViewModel model);
    }
}
