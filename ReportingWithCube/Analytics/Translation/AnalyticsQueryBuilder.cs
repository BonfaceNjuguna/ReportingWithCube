using System.Security.Claims;
using ReportingWithCube.Analytics.Models;
using ReportingWithCube.Analytics.Semantic;

namespace ReportingWithCube.Analytics.Translation;

/// <summary>
/// Translates UI queries to Cube.js queries
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

        var simpleFilters = TranslateFilters(uiRequest.Filters, dataset, user);
        var groupFilters = TranslateFilterGroups(uiRequest.FilterGroups, dataset);
        var allFilters = simpleFilters.Concat(groupFilters).ToArray();

        return new AnalyticsQueryRequest
        {
            Dataset = dataset.Id,
            Measures = TranslateMeasures(uiRequest.Kpis, dataset),
            Dimensions = TranslateDimensions(uiRequest.GroupBy, dataset),
            TimeDimensions = TranslateTimeDimensions(uiRequest.Filters, dataset),
            Filters = allFilters,
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

        if (dataset.Security != null && user != null)
        {
            InjectSecurityFilters(filters, dataset, user);
        }

        return filters.ToArray();
    }

    private CubeFilter[] TranslateFilterGroups(FilterGroup[] filterGroups, DatasetDefinition dataset)
    {
        var filters = new List<CubeFilter>();

        foreach (var group in filterGroups)
        {
            var groupFilters = new List<CubeFilter>();

            foreach (var uiFilter in group.Filters.Where(f => !IsTimeDimension(f, dataset)))
            {
                if (dataset.Filters.TryGetValue(uiFilter.Field, out var filterDef))
                {
                    groupFilters.Add(new CubeFilter
                    {
                        Member = filterDef.CubeMember,
                        Operator = TranslateOperator(uiFilter.Operator),
                        Values = NormalizeValues(uiFilter.Value)
                    });
                }
            }

            if (groupFilters.Count > 0)
            {
                if (group.Logic.Equals("or", StringComparison.OrdinalIgnoreCase))
                {
                    filters.Add(new CubeFilter { Or = groupFilters.ToArray() });
                }
                else
                {
                    filters.Add(new CubeFilter { And = groupFilters.ToArray() });
                }
            }
        }

        return filters.ToArray();
    }

    private void InjectSecurityFilters(List<CubeFilter> filters, DatasetDefinition dataset, ClaimsPrincipal user)
    {
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

        if (dataset.Measures.TryGetValue(sort.By, out var measure))
        {
            return new Dictionary<string, string>
            {
                { measure.CubeMember, sort.Direction.ToLower() }
            };
        }

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
        if (value is string strValue)
        {
            if (strValue.StartsWith("last", StringComparison.OrdinalIgnoreCase))
            {
                return strValue;
            }
            
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
        
        if (value is System.Text.Json.JsonElement jsonElement)
        {
            if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                return jsonElement.EnumerateArray()
                    .Select(e => e.GetString() ?? string.Empty)
                    .ToArray();
            }
            return new[] { jsonElement.GetString() ?? string.Empty };
        }
        
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
