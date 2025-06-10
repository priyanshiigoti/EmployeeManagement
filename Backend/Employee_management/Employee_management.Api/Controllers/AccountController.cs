using Employee_management.Interfaces.Interfaces;
using Employee_management.Shared.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading.Tasks;


namespace Employee_management.Repositories.Service.Classes

{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly ILogger<AccountController> _logger;
        private readonly IConfiguration _configuration;

        public AccountController(IAccountService accountService, ILogger<AccountController> logger, IConfiguration configuration)
        {
            _accountService = accountService;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpPost("RegisterEmployee")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterEmployee([FromForm] UserRegistrationDto dto)
        {
            _logger.LogInformation("Registration attempt for {Email}", dto.Email);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for registration");
                return BadRequest(ModelState);
            }

            var result = await _accountService.RegisterEmployeeAsync(dto);

            if (!result.IsSuccess)
            {
                _logger.LogWarning("Registration failed: {Message}", result.Message);
                return BadRequest(new { Errors = new[] { result.Message } });
            }

            _logger.LogInformation("Registration successful for {Email}", dto.Email);
            return Ok(new { Message = result.Message });
        }


        //[HttpPost("Login")]
        //[AllowAnonymous]
        //public async Task<IActionResult> Login([FromBody] LoginDto dto)
        //{
        //    if (!ModelState.IsValid)
        //        return BadRequest(ModelState);

        //    try
        //    {
        //        var response = await _accountService.LoginAsync(dto);
        //        if (response == null)
        //            return Unauthorized(new { Message = "Invalid credentials." });

        //        return Ok(response);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error during login");
        //        return StatusCode(500, new { Message = "An error occurred during login." });
        //    }
        //}

        [HttpPost("Login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var response = await _accountService.LoginAsync(dto);

                if (response == null)
                {
                    return Unauthorized(new { Message = "Invalid credentials." });
                }

                // If response is AuthResponse with failure (like email not confirmed)
                if (response is AuthResponse authResponse && !authResponse.IsSuccess)
                {
                    return Unauthorized(new { Message = authResponse.Message });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, new { Message = "An error occurred during login." });
            }
        }


        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            _logger.LogInformation("ConfirmEmail called with userId: {UserId}", userId);

            try
            {
                var result = await _accountService.ConfirmEmailAsync(userId, token);

                if (!result.IsSuccess)
                {
                    _logger.LogWarning("Email confirmation failed: {Message}", result.Message);
                    return Redirect($"{_configuration["ClientUrl"]}/login?error={Uri.EscapeDataString(result.Message)}");
                }

                _logger.LogInformation("Email confirmed successfully for user: {UserId}", userId);
                return Redirect($"{_configuration["ClientUrl"]}/login?confirmed=true");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming email for user: {UserId}", userId);
                return Redirect($"{_configuration["ClientUrl"]}/login?error=An error occurred during confirmation");
            }
        }


        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordViewModel model)
        {
            try
            {
                if (model == null)
                {
                    return BadRequest(new AuthResponse { IsSuccess = false, Message = "Request body cannot be null" });
                }

                var result = await _accountService.ForgotPasswordAsync(model.Email);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during forgot password");
                return StatusCode(500, new AuthResponse
                {
                    IsSuccess = false,
                    Message = "An internal server error occurred"
                });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordViewModel model)
        {
            try
            {
                if (model == null)
                {
                    return BadRequest(new AuthResponse { IsSuccess = false, Message = "Request body cannot be null" });
                }

                var result = await _accountService.ResetPasswordAsync(model);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset");
                return StatusCode(500, new AuthResponse
                {
                    IsSuccess = false,
                    Message = "An internal server error occurred"
                });
            }
        }
    }
}