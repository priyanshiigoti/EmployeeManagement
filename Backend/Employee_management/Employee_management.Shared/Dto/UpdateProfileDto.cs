namespace Employee_management.Shared.Dto
{
    public class UpdateProfileDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string CurrentPassword { get; set; } // For password change
        public string NewPassword { get; set; }    // For password change
        public string ProfileImagePath { get; set; }

    }
}
