using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Employee_management.Shared
{
    public class Employee
    {
        public int Id { get; set; }

        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }

        public string? ManagerId { get; set; }
        public ApplicationUser? Manager { get; set; }

        public DateTime? HireDate { get; set; }
        public bool IsActive { get; set; }
    }
}
