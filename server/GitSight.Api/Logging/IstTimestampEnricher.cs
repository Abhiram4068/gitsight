using Serilog.Core;
using Serilog.Events;
using System;

namespace GitSight.Api.Logging;

public class IstTimestampEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        var istTime = TimeZoneInfo.ConvertTimeFromUtc(logEvent.Timestamp.UtcDateTime, istZone);
        logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("IstTimestamp", istTime.ToString("yyyy-MM-dd HH:mm:ss.fff")));
    }
}
