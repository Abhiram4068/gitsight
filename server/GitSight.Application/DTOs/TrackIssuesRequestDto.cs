using System.Collections.Generic;

namespace GitSight.Application.DTOs;

public class TrackIssuesRequestDto
{
    public int PullRequestNumber { get; set; }
    public Guid SessionId { get; set; }
}
