using System.Security.Claims;
using System.Text.Json;
using ReportingWithCube.Analytics.Models;
using ReportingWithCube.Analytics.Semantic;

namespace ReportingWithCube.Analytics.Translation.Strategies;

public abstract class BaseTranslationStrategy : ITranslationStrategy
{
    protected readonly ILogger _logger;

    protected BaseTranslationStrategy(ILogger logger)
    {
        _logger = logger;
    }

    public virtual string[] TranslateMeasures(string[] kpiIds, DatasetDefinition dataset)
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

    public virtual string[] TranslateDimensions(string[] groupByIds, DatasetDefinition dataset)
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

    public virtual TimeDimension[] TranslateTimeDimensions(UiFilter[] filters, DatasetDefinition dataset)
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

    public virtual CubeFilter[] TranslateFilters(UiFilter[] uiFilters, DatasetDefinition dataset, ClaimsPrincipal? user)
    {
        var filters = new List<CubeFilter>();

        // Translate UI filters (simple AND logic)
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

    public virtual CubeFilter[] TranslateFilterGroups(FilterGroup[] filterGroups, DatasetDefinition dataset)
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

    public virtual Dictionary<string, string>? TranslateOrder(UiSort? sort, DatasetDefinition dataset)
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

    public virtual int ApplyLimitPolicy(int requestedLimit, DatasetDefinition dataset)
    {
        var maxLimit = dataset.Security?.MaxLimit ?? 1000;
        return Math.Min(requestedLimit, maxLimit);
    }

    protected virtual void InjectSecurityFilters(List<CubeFilter> filters, DatasetDefinition dataset, ClaimsPrincipal user)
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
                    Values = [tenantId]
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
                    Values = [userId]
                });
                
                _logger.LogDebug("Injected user filter: {UserId}", userId);
            }
        }
    }

    protected bool IsTimeDimension(UiFilter filter, DatasetDefinition dataset)
    {
        return dataset.Filters.TryGetValue(filter.Field, out var filterDef) 
               && filterDef.Type == FilterType.Time;
    }

    protected JsonElement TranslateDateRange(JsonElement value)
    {
        // Handle common date range formats
        if (value.ValueKind == JsonValueKind.String)
        {
            var strValue = value.GetString() ?? string.Empty;

            // "last 90 days", "last 6 months", etc.
            if (strValue.StartsWith("last", StringComparison.OrdinalIgnoreCase))
            {
                return value;
            }
            
            // "2024-01-01,2024-12-31" or array
            if (strValue.Contains(','))
            {
                var parts = strValue.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
                return JsonSerializer.SerializeToElement(parts);
            }
        }

        return value;
    }

    protected string TranslateOperator(string uiOperator)
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

    protected string[] NormalizeValues(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.Array)
        {
            return value.EnumerateArray()
                .Select(element => element.ValueKind == JsonValueKind.String
                    ? element.GetString() ?? string.Empty
                    : element.ToString())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .ToArray();
        }

        if (value.ValueKind == JsonValueKind.String)
        {
            var text = value.GetString() ?? string.Empty;
            if (text.Contains(','))
            {
                return text.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            }

            return [text];
        }

        if (value.ValueKind == JsonValueKind.Number)
        {
            return [value.ToString()];
        }

        if (value.ValueKind == JsonValueKind.True || value.ValueKind == JsonValueKind.False)
        {
            return [value.GetBoolean().ToString().ToLowerInvariant()];
        }

        return Array.Empty<string>();
    }

    protected string GetTenantId(ClaimsPrincipal user)
    {
        return user.FindFirst("tenant_id")?.Value 
               ?? user.FindFirst("http://schemas.microsoft.com/identity/claims/tenantid")?.Value 
               ?? string.Empty;
    }

    protected string GetUserId(ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.NameIdentifier)?.Value 
               ?? user.FindFirst("sub")?.Value 
               ?? string.Empty;
    }
}
