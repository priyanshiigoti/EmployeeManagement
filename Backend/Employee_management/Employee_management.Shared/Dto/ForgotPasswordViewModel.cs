using System.ComponentModel.DataAnnotations;

namespace Employee_management.Shared.Dto

{
    public class ForgotPasswordViewModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}
