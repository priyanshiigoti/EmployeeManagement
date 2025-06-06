namespace Employee_management.Shared.Dto
{
    public class DepartmentDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }    // Add Description
        public bool IsActive { get; set; }  // Added to indicate active status
    }
}
