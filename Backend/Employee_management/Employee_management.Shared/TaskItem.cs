using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Employee_management.Shared
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }

        public string AssignedToId { get; set; }
        public ApplicationUser AssignedTo { get; set; }

        public string CreatedById { get; set; }
        public ApplicationUser CreatedBy { get; set; }

        public DateTime? DueDate { get; set; }
        public string Status { get; set; } // Pending, InProgress, Completed
    }
}
