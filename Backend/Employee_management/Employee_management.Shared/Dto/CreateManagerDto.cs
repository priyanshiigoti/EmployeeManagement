namespace Employee_management.Shared.Dto
{
    public class CreateManagerDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public int? DepartmentId { get; set; }  // Changed to nullable
        public string? DepartmentName { get; set; }
        public bool IsActive { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
    }

    public class UpdateManagerDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public int? DepartmentId { get; set; }  // Changed to nullable
        public bool IsActive { get; set; }
    }
}
