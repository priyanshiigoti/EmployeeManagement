namespace Employee_management.Shared.Dto
{
    public class CreateManagerDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public int DepartmentId { get; set; }
        public bool IsActive { get; set; }
        public string Password { get; set; }
    }
}
