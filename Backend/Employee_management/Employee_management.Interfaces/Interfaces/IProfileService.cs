﻿using Employee_management.Interfaces;
using Employee_management.Shared.Dto;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Employee_management.Interfaces.Interfaces
{
    public interface IProfileService
    {
        Task<(bool success, string message)> UpdateProfileAsync(string userId, UpdateProfileDto dto);
        Task<object> GetUserProfileAsync(string userId);
        Task<(bool success, string message)> UpdateProfileImageAsync(string userId, IFormFile file);
    }
}