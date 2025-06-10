using Employee_management.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using Employee_management.Shared.Dto;
using Employee_management.Interfaces.Interfaces;
using Employee_management.Api.Data;
using Microsoft.Extensions.Logging;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Hosting;


namespace Employee_management.Repositories.Services.Classes
{
    public class AccountService : IAccountService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AccountService> _logger;
        private readonly IEmailSender _emailSender;
        private readonly IWebHostEnvironment _env;


        public AccountService(
            UserManager<ApplicationUser> userManager,
            IConfiguration config,
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext context,
            ILogger<AccountService> logger,
            IEmailSender emailSender, IWebHostEnvironment env)
        {
            _userManager = userManager;
            _config = config;
            _roleManager = roleManager;
            _context = context;
            _logger = logger;
            _emailSender = emailSender;
            _env = env;
        }

        public async Task<AuthResponse> RegisterEmployeeAsync(UserRegistrationDto dto)
        {
            try
            {

                // 2. Check for existing email
                var existingUser = await _userManager.FindByEmailAsync(dto.Email);
                if (existingUser != null)
                {
                    return new AuthResponse
                    {
                        IsSuccess = false,
                        Message = "Email is already in use."
                    };
                }

                // 2.5. Check for existing phone number
                var existingPhoneUser = await _userManager.Users
                    .FirstOrDefaultAsync(u => u.PhoneNumber == dto.PhoneNumber);
                if (existingPhoneUser != null)
                {
                    return new AuthResponse
                    {
                        IsSuccess = false,
                        Message = "Phone number is already registered."
                    };
                }

                string profileImagePath = null;
                if (dto.ProfileImage != null && dto.ProfileImage.Length > 0)
                {
                    var uploadsFolder = Path.Combine(
                        _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                        "profile-images");

                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    var uniqueFileName = Guid.NewGuid().ToString() + "_" + dto.ProfileImage.FileName;
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.ProfileImage.CopyToAsync(fileStream);
                    }

                    profileImagePath = $"/profile-images/{uniqueFileName}";
                }


                // 3. Create new ApplicationUser
                var user = new ApplicationUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    EmailConfirmed = false,
                    ProfileImagePath = profileImagePath
                };

                var createResult = await _userManager.CreateAsync(user, dto.Password);
                if (!createResult.Succeeded)
                {
                    // Clean up uploaded file if user creation fails
                    if (profileImagePath != null)
                    {
                        var filePath = Path.Combine(_env.WebRootPath, profileImagePath.TrimStart('/'));
                        if (File.Exists(filePath))
                        {
                            File.Delete(filePath);
                        }
                    }

                    var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                    return new AuthResponse
                    {
                        IsSuccess = false,
                        Message = errors
                    };
                }

                // 4. Assign role
                var roleResult = await _userManager.AddToRoleAsync(user, dto.Role);
                if (!roleResult.Succeeded)
                {
                    // Rollback user creation if role assignment fails
                    await _userManager.DeleteAsync(user);
                    var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                    return new AuthResponse
                    {
                        IsSuccess = false,
                        Message = errors
                    };
                }

                // 5. Create Employee record
                var employee = new Employee
                {
                    UserId = user.Id,
                    DepartmentId = dto.DepartmentId ?? 0,
                    ManagerId = null,
                    HireDate = DateTime.UtcNow,
                    IsActive = true
                };

                await _context.Employees.AddAsync(employee);
                await _context.SaveChangesAsync();

                // 6. Generate Email Confirmation Token
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

                // 7. Build Confirmation URL
                var confirmationUrl = $"{_config["ApiBaseUrl"]}api/account/confirm-email?userId={user.Id}&token={System.Net.WebUtility.UrlEncode(token)}";

                // 8. Send confirmation email
                await _emailSender.SendEmailAsync(user.Email, "Confirm your email",
                    $@"Please confirm your email by clicking the link below:<br/><br/>
    <a href='{confirmationUrl}'>Click to confirm your email</a><br/><br/>
    If the above link doesn't work, copy and paste this into your browser:<br/>
    {confirmationUrl}");

                // 9. Return success response
                return new AuthResponse
                {
                    IsSuccess = true,
                    Message = "Registration successful! Please check your email to confirm your account."
                };
            }
            catch (Exception ex)
            {
                return new AuthResponse
                {
                    IsSuccess = false,
                    Message = $"An error occurred during registration: {ex.Message}"
                };
            }
        }

      

        public async Task<object> LoginAsync(LoginDto dto)
        {
            // 1. Validate user exists
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
                return null; // Invalid credentials

            // 2. Get roles
            var roles = await _userManager.GetRolesAsync(user);

            // 3. Check if email is confirmed only if user is in "Employee" role
            if (roles.Contains("Employee") && !user.EmailConfirmed)
            {
                return new AuthResponse
                {
                    IsSuccess = false,
                    Message = "Email not confirmed. Please check your email to confirm your account before logging in."
                };
            }

            if (roles.Contains("Employee"))
            {
                var emp = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == user.Id);
                if (emp == null || !emp.IsActive)
                {
                    return new AuthResponse
                    {
                        IsSuccess = false,
                        Message = "Your account is inactive. Please contact administrator."
                    };
                }
            }

            // 4. Create claims
            var claims = new List<Claim>
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id),
        new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Name, user.UserName ?? "")
    };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // 5. JWT token generation
            var jwtSettings = _config.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"]);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: creds
            );

            var tokenHandler = new JwtSecurityTokenHandler();

            return new
            {
                token = tokenHandler.WriteToken(token),
                expiration = token.ValidTo,
                userId = user.Id,
                userName = user.UserName,
                roles = roles
            };
        }



        public async Task<AuthResponse> ConfirmEmailAsync(string userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return new AuthResponse { IsSuccess = false, Message = "User not found." };

            var result = await _userManager.ConfirmEmailAsync(user, token);
            return new AuthResponse
            {
                IsSuccess = result.Succeeded,
                Message = result.Succeeded ? "Email confirmed." : "Email confirmation failed."
            };
        }

        public async Task<AuthResponse> ForgotPasswordAsync(string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    return new AuthResponse { IsSuccess = false, Message = "Email is required." };
                }

                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    return new AuthResponse { IsSuccess = false, Message = "No user found with this email." };
                }

                if (!user.EmailConfirmed)
                {
                    return new AuthResponse { IsSuccess = false, Message = "Email is not confirmed." };
                }

                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var resetUrl = $"{_config["ClientUrl"]}/reset-password?token={System.Net.WebUtility.UrlEncode(token)}&email={System.Net.WebUtility.UrlEncode(email)}";

                await _emailSender.SendEmailAsync(email, "Reset Password",
    $@"Please reset your password by clicking the link below:<br/><br/>
<a href='{resetUrl}'>Click to reset your password</a><br/><br/>
If the above link doesn't work, copy and paste this into your browser:<br/>
{resetUrl.Replace("&", "&amp;")}");

                return new AuthResponse { IsSuccess = true, Message = "Password reset link has been sent to your email." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ForgotPasswordAsync");
                return new AuthResponse
                {
                    IsSuccess = false,
                    Message = $"An error occurred: {ex.Message}"
                };
            }
        }

        public async Task<AuthResponse> ResetPasswordAsync(ResetPasswordViewModel model)
        {
            try
            {
                if (model == null)
                {
                    return new AuthResponse { IsSuccess = false, Message = "Invalid request." };
                }

                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    return new AuthResponse { IsSuccess = false, Message = "User not found." };
                }

                var result = await _userManager.ResetPasswordAsync(user, model.Token, model.Password);
                if (result.Succeeded)
                {
                    return new AuthResponse { IsSuccess = true, Message = "Password has been reset successfully." };
                }

                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return new AuthResponse { IsSuccess = false, Message = errors };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ResetPasswordAsync");
                return new AuthResponse
                {
                    IsSuccess = false,
                    Message = $"An error occurred: {ex.Message}"
                };
            }
        }
    }
}