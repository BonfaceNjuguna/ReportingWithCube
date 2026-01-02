using System.Security.Claims;
using System.Text.Json;
using ReportingWithCube.Analytics.Models;
using ReportingWithCube.Analytics.Semantic;

namespace ReportingWithCube.Analytics.Validation;

/// <summary>
/// Validates and enforces security policies on analytics queries
/// </summary>
public interface IAnalyticsQueryValidator
{
    void Validate(UiQueryRequest request, DatasetDefinition dataset, ClaimsPrincipal? user = null);
}

public class AnalyticsQueryValidator : IAnalyticsQueryValidator
{
    private readonly ILogger<AnalyticsQueryValidator> _logger;

    public AnalyticsQueryValidator(ILogger<AnalyticsQueryValidator> logger)
    {
        _logger = logger;
    }

    public void Validate(UiQueryRequest request, DatasetDefinition dataset, ClaimsPrincipal? user = null)
    {
        ValidateDataset(request.DatasetId, dataset);
        ValidateKpis(request.Kpis, dataset);
        ValidateDimensions(request.GroupBy, dataset);
        ValidateFilters(request.Filters, dataset);
        ValidateFilterGroups(request.FilterGroups, dataset);
        ValidateLimits(request.Page, dataset);
        ValidateSort(request.Sort, dataset);
    }

    private void ValidateDataset(string datasetId, DatasetDefinition dataset)
    {
        if (string.IsNullOrWhiteSpace(datasetId))
        {
            throw new ValidationException("Dataset ID is required");
        }

        if (dataset == null)
        {
            throw new ValidationException($"Dataset '{datasetId}' not found");
        }
    }

    private void ValidateKpis(string[] kpiIds, DatasetDefinition dataset)
    {
        foreach (var kpiId in kpiIds)
        {
            if (!dataset.Measures.ContainsKey(kpiId))
            {
                throw new ValidationException($"KPI '{kpiId}' is not allowed for dataset '{dataset.Id}'");
            }
        }
    }

    private void ValidateDimensions(string[] dimensionIds, DatasetDefinition dataset)
    {
        foreach (var dimensionId in dimensionIds)
        {
            if (!dataset.Dimensions.ContainsKey(dimensionId))
            {
                throw new ValidationException($"Dimension '{dimensionId}' is not allowed for dataset '{dataset.Id}'");
            }
        }
    }

    private void ValidateFilters(UiFilter[] filters, DatasetDefinition dataset)
    {
        foreach (var filter in filters)
        {
            if (!dataset.Filters.ContainsKey(filter.Field))
            {
                throw new ValidationException($"Filter field '{filter.Field}' is not allowed for dataset '{dataset.Id}'");
            }

            var filterDef = dataset.Filters[filter.Field];
            
            if (filterDef.AllowedOperators.Length > 0 && 
                !filterDef.AllowedOperators.Contains(filter.Operator, StringComparer.OrdinalIgnoreCase))
            {
                throw new ValidationException(
                    $"Operator '{filter.Operator}' is not allowed for filter '{filter.Field}'. " +
                    $"Allowed operators: {string.Join(", ", filterDef.AllowedOperators)}");
            }

            if (filterDef.Type == FilterType.Time && dataset.Security != null)
            {
                ValidateDateRange(filter, dataset.Security.MaxDateRangeDays);
            }
        }
    }

    private void ValidateDateRange(UiFilter filter, int maxDateRangeDays)
    {
        if (!TryParseDateRange(filter.Value, out var start, out var end))
        {
            return;
        }

        var days = (end - start).Days;
        if (days > maxDateRangeDays)
        {
            throw new ValidationException(
                $"Date range exceeds maximum allowed ({maxDateRangeDays} days). Requested: {days} days");
        }
    }

    private static bool TryParseDateRange(JsonElement value, out DateTime start, out DateTime end)
    {
        start = default;
        end = default;

        if (value.ValueKind == JsonValueKind.Array)
        {
            var items = value.EnumerateArray().Select(item => item.ValueKind == JsonValueKind.String
                ? item.GetString()
                : item.ToString()).ToArray();

            if (items.Length >= 2 &&
                DateTime.TryParse(items[0], out start) &&
                DateTime.TryParse(items[1], out end))
            {
                return true;
            }

            return false;
        }

        if (value.ValueKind == JsonValueKind.String)
        {
            var text = value.GetString();
            if (string.IsNullOrWhiteSpace(text) || !text.Contains(','))
            {
                return false;
            }

            var parts = text.Split(',', 2, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 2 &&
                DateTime.TryParse(parts[0], out start) &&
                DateTime.TryParse(parts[1], out end))
            {
                return true;
            }
        }

        return false;
    }

    private void ValidateFilterGroups(FilterGroup[] filterGroups, DatasetDefinition dataset)
    {
        foreach (var group in filterGroups)
        {
            if (!new[] { "and", "or" }.Contains(group.Logic.ToLower()))
            {
                throw new ValidationException($"Invalid filter logic '{group.Logic}'. Must be 'and' or 'or'");
            }

            ValidateFilters(group.Filters, dataset);
        }
    }

    private void ValidateLimits(UiPagination page, DatasetDefinition dataset)
    {
        if (page.Limit < 1)
        {
            throw new ValidationException("Limit must be at least 1");
        }

        if (page.Offset < 0)
        {
            throw new ValidationException("Offset must be non-negative");
        }

        if (dataset.Security != null && page.Limit > dataset.Security.MaxLimit)
        {
            throw new ValidationException(
                $"Limit exceeds maximum allowed ({dataset.Security.MaxLimit}). Requested: {page.Limit}");
        }
    }

    private void ValidateSort(UiSort? sort, DatasetDefinition dataset)
    {
        if (sort == null) return;

        var isValidMeasure = dataset.Measures.ContainsKey(sort.By);
        var isValidDimension = dataset.Dimensions.ContainsKey(sort.By);

        if (!isValidMeasure && !isValidDimension)
        {
            throw new ValidationException($"Sort field '{sort.By}' is not a valid measure or dimension");
        }

        if (!new[] { "asc", "desc" }.Contains(sort.Direction.ToLower()))
        {
            throw new ValidationException($"Sort direction must be 'asc' or 'desc'. Got: '{sort.Direction}'");
        }
    }
}

public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}
