namespace Employee_management.Shared.Dto
{
    public class UpdateManagerDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public int DepartmentId { get; set; }
        public bool IsActive { get; set; }
    }
}
