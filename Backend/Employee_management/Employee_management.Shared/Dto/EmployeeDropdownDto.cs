namespace Employee_management.Shared.Dto
{
    public class EmployeeDropdownDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string DepartmentName { get; set; }
        public int DepartmentId { get; internal set; }
        public string FullName { get; set; } // Add this property

    }

}
