using System;
using System.Threading.Tasks;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IAnalyticsService
{
    Task<ApiResponse<DashboardAnalyticsDto>> GetDashboardAnalyticsAsync(string? token, Guid? userId);
}
