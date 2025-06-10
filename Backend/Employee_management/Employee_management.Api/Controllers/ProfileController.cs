
using Employee_management.Interfaces.Interfaces;
using Employee_management.Shared.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Employee_management.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var profile = await _profileService.GetUserProfileAsync(userId);
            if (profile == null)
                return NotFound();

            return Ok(profile);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var (success, message) = await _profileService.UpdateProfileAsync(userId, dto);
            if (!success)
                return BadRequest(new { Message = message });

            return Ok(new { Message = message });
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadProfileImage()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var files = Request.Form.Files;
            if (files.Count == 0)
                return BadRequest(new { Message = "No file uploaded." });

            var file = files[0];

            if (file.Length > 2 * 1024 * 1024) // 2 MB limit for example
                return BadRequest(new { Message = "File size exceeds limit." });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = System.IO.Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { Message = "Invalid file type." });

            // Pass to service for saving file and updating user profile image path
            var (success, message) = await _profileService.UpdateProfileImageAsync(userId, file);

            if (!success)
                return BadRequest(new { Message = message });

            return Ok(new { Message = message });
        }

    }
}