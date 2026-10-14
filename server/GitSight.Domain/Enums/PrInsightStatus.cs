namespace GitSight.Domain.Enums;

public enum PrInsightStatus
{
    /// <summary>
    /// It's initial
    /// </summary>
    Pending = 0,
    
    /// <summary>
    /// When AI starts to review
    /// </summary>
    Analyzing = 1,
    
    /// <summary>
    /// Finished
    /// </summary>
    Analyzed = 2,
    
    /// <summary>
    /// The user manually closes the insight
    /// </summary>
    Closed = 3,

    /// <summary>
    /// The AI review failed
    /// </summary>
    Failed = 4
}
