using System.Security.Claims;
using ReportingWithCube.Analytics.Models;
using ReportingWithCube.Analytics.Semantic;

namespace ReportingWithCube.Analytics.Translation;

/// <summary>
/// Translates UI intent (business language) to Cube.js queries (technical)
/// This is the core translation layer
/// </summary>
public interface IAnalyticsQueryBuilder
{
    AnalyticsQueryRequest Build(UiQueryRequest uiRequest, DatasetDefinition dataset, ClaimsPrincipal? user = null);
}

public class AnalyticsQueryBuilder : IAnalyticsQueryBuilder
{
    private readonly ILogger<AnalyticsQueryBuilder> _logger;

    public AnalyticsQueryBuilder(ILogger<AnalyticsQueryBuilder> logger)
    {
        _logger = logger;
    }

    public AnalyticsQueryRequest Build(UiQueryRequest uiRequest, DatasetDefinition dataset, ClaimsPrincipal? user = null)
    {
        _logger.LogDebug("Building Cube.js query for dataset: {Dataset}", dataset.Id);

        return new AnalyticsQueryRequest
        {
            Dataset = dataset.Id,
            Measures = TranslateMeasures(uiRequest.Kpis, dataset),
            Dimensions = TranslateDimensions(uiRequest.GroupBy, dataset),
            TimeDimensions = TranslateTimeDimensions(uiRequest.Filters, dataset),
            Filters = TranslateFilters(uiRequest.Filters, dataset, user),
            Order = TranslateOrder(uiRequest.Sort, dataset),
            Limit = ApplyLimitPolicy(uiRequest.Page.Limit, dataset),
            Offset = uiRequest.Page.Offset
        };
    }

    private string[] TranslateMeasures(string[] kpiIds, DatasetDefinition dataset)
    {
        var measures = new List<string>();
        
        foreach (var kpiId in kpiIds)
        {
            if (dataset.Measures.TryGetValue(kpiId, out var measureDef))
            {
                measures.Add(measureDef.CubeMember);
            }
            else
            {
                _logger.LogWarning("Unknown KPI '{KpiId}' for dataset '{Dataset}'", kpiId, dataset.Id);
            }
        }

        return measures.ToArray();
    }

    private string[] TranslateDimensions(string[] groupByIds, DatasetDefinition dataset)
    {
        var dimensions = new List<string>();
        
        foreach (var groupById in groupByIds)
        {
            if (dataset.Dimensions.TryGetValue(groupById, out var dimensionDef))
            {
                dimensions.Add(dimensionDef.CubeMember);
            }
            else
            {
                _logger.LogWarning("Unknown dimension '{DimensionId}' for dataset '{Dataset}'", groupById, dataset.Id);
            }
        }

        return dimensions.ToArray();
    }

    private TimeDimension[] TranslateTimeDimensions(UiFilter[] filters, DatasetDefinition dataset)
    {
        var timeDimensions = new List<TimeDimension>();

        foreach (var filter in filters.Where(f => IsTimeDimension(f, dataset)))
        {
            if (dataset.Filters.TryGetValue(filter.Field, out var filterDef))
            {
                timeDimensions.Add(new TimeDimension
                {
                    Dimension = filterDef.CubeMember,
                    DateRange = TranslateDateRange(filter.Value),
                    Granularity = null
                });
            }
        }

        return timeDimensions.ToArray();
    }

    private CubeFilter[] TranslateFilters(UiFilter[] uiFilters, DatasetDefinition dataset, ClaimsPrincipal? user)
    {
        var filters = new List<CubeFilter>();

        // Translate UI filters
        foreach (var uiFilter in uiFilters.Where(f => !IsTimeDimension(f, dataset)))
        {
            if (dataset.Filters.TryGetValue(uiFilter.Field, out var filterDef))
            {
                filters.Add(new CubeFilter
                {
                    Member = filterDef.CubeMember,
                    Operator = TranslateOperator(uiFilter.Operator),
                    Values = NormalizeValues(uiFilter.Value)
                });
            }
        }

        // 🔐 SECURITY: Inject mandatory filters (tenant, user, etc.)
        if (dataset.Security != null && user != null)
        {
            InjectSecurityFilters(filters, dataset, user);
        }

        return filters.ToArray();
    }

    private void InjectSecurityFilters(List<CubeFilter> filters, DatasetDefinition dataset, ClaimsPrincipal user)
    {
        // Tenant-level security
        if (!string.IsNullOrEmpty(dataset.Security!.TenantFilterMember))
        {
            var tenantId = GetTenantId(user);
            if (!string.IsNullOrEmpty(tenantId))
            {
                filters.Add(new CubeFilter
                {
                    Member = dataset.Security.TenantFilterMember,
                    Operator = "equals",
                    Values = new[] { tenantId }
                });
                
                _logger.LogDebug("Injected tenant filter: {TenantId}", tenantId);
            }
        }

        // User-level security
        if (!string.IsNullOrEmpty(dataset.Security!.UserFilterMember))
        {
            var userId = GetUserId(user);
            if (!string.IsNullOrEmpty(userId))
            {
                filters.Add(new CubeFilter
                {
                    Member = dataset.Security.UserFilterMember,
                    Operator = "equals",
                    Values = new[] { userId }
                });
                
                _logger.LogDebug("Injected user filter: {UserId}", userId);
            }
        }
    }

    private Dictionary<string, string>? TranslateOrder(UiSort? sort, DatasetDefinition dataset)
    {
        if (sort == null) return null;

        // Check if it's a measure
        if (dataset.Measures.TryGetValue(sort.By, out var measure))
        {
            return new Dictionary<string, string>
            {
                { measure.CubeMember, sort.Direction.ToLower() }
            };
        }

        // Check if it's a dimension
        if (dataset.Dimensions.TryGetValue(sort.By, out var dimension))
        {
            return new Dictionary<string, string>
            {
                { dimension.CubeMember, sort.Direction.ToLower() }
            };
        }

        return null;
    }

    private int ApplyLimitPolicy(int requestedLimit, DatasetDefinition dataset)
    {
        var maxLimit = dataset.Security?.MaxLimit ?? 1000;
        return Math.Min(requestedLimit, maxLimit);
    }

    private bool IsTimeDimension(UiFilter filter, DatasetDefinition dataset)
    {
        return dataset.Filters.TryGetValue(filter.Field, out var filterDef) 
               && filterDef.Type == FilterType.Time;
    }

    private object TranslateDateRange(object value)
    {
        // Handle common date range formats
        if (value is string strValue)
        {
            // "last 90 days", "last 6 months", etc.
            if (strValue.StartsWith("last", StringComparison.OrdinalIgnoreCase))
            {
                return strValue;
            }
            
            // "2024-01-01,2024-12-31" or array
            if (strValue.Contains(','))
            {
                return strValue.Split(',');
            }
        }

        return value;
    }

    private string TranslateOperator(string uiOperator)
    {
        return uiOperator.ToLower() switch
        {
            "eq" or "equals" => "equals",
            "ne" or "notequals" => "notEquals",
            "gt" or "greaterthan" => "gt",
            "gte" or "greaterthanorequal" => "gte",
            "lt" or "lessthan" => "lt",
            "lte" or "lessthanorequal" => "lte",
            "contains" => "contains",
            "notcontains" => "notContains",
            "startswith" => "startsWith",
            "endswith" => "endsWith",
            "in" => "equals",
            "notin" => "notEquals",
            _ => "equals"
        };
    }

    private string[] NormalizeValues(object value)
    {
        if (value is string[] strArray)
            return strArray;
        
        if (value is IEnumerable<string> enumerable)
            return enumerable.ToArray();
        
        return new[] { value.ToString() ?? string.Empty };
    }

    private string GetTenantId(ClaimsPrincipal user)
    {
        return user.FindFirst("tenant_id")?.Value 
               ?? user.FindFirst("http://schemas.microsoft.com/identity/claims/tenantid")?.Value 
               ?? string.Empty;
    }

    private string GetUserId(ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.NameIdentifier)?.Value 
               ?? user.FindFirst("sub")?.Value 
               ?? string.Empty;
    }
}
