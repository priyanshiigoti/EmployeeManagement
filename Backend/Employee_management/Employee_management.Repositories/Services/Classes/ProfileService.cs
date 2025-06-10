using Employee_management.Api.Data;
using Employee_management.Interfaces.Interfaces;
using Employee_management.Shared;
using Employee_management.Shared.Dto;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace Employee_management.Repositories.Services.Classes
{
    public class ProfileService : IProfileService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public ProfileService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<object> GetUserProfileAsync(string userId)
        {
            var user = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => new
                {
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.PhoneNumber,
                    u.ProfileImagePath // return the image path

                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return null;
            }

            return user;
        }

        public async Task<(bool success, string message)> UpdateProfileAsync(string userId, UpdateProfileDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return (false, "User not found");

            // Update profile fields
            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.PhoneNumber = dto.PhoneNumber;

            // Update profile image path if provided
            if (!string.IsNullOrEmpty(dto.ProfileImagePath))
            {
                user.ProfileImagePath = dto.ProfileImagePath;
            }

            // Rest of the method remains the same...
            if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
                    return (false, "Current password is required to change password");

                if (!await _userManager.CheckPasswordAsync(user, dto.CurrentPassword))
                    return (false, "Current password is incorrect");

                var result = await _userManager.ChangePasswordAsync(
                    user,
                    dto.CurrentPassword,
                    dto.NewPassword
                );

                if (!result.Succeeded)
                    return (false, string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            var updateResult = await _userManager.UpdateAsync(user);
            return updateResult.Succeeded
                ? (true, "Profile updated successfully")
                : (false, string.Join(", ", updateResult.Errors.Select(e => e.Description)));
        }

        public async Task<(bool success, string message)> UpdateProfileImageAsync(string userId, IFormFile file)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return (false, "User not found");

            // Folder path for storing images - adjust as needed
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "profileimages");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // Create unique file name
            var uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Save the file
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // Save relative path to user profile (adjust your ApplicationUser to have ProfileImagePath property)
            user.ProfileImagePath = $"/uploads/profileimages/{uniqueFileName}";

            var updateResult = await _userManager.UpdateAsync(user);

            return updateResult.Succeeded
                ? (true, "Profile image updated successfully")
                : (false, string.Join(", ", updateResult.Errors.Select(e => e.Description)));
        }

    }

}