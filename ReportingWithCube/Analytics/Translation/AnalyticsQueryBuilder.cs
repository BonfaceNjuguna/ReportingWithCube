using System.Security.Claims;
using ReportingWithCube.Analytics.Models;
using ReportingWithCube.Analytics.Semantic;
using ReportingWithCube.Analytics.Translation.Strategies;

namespace ReportingWithCube.Analytics.Translation;

public interface IAnalyticsQueryBuilder
{
    AnalyticsQueryRequest Build(UiQueryRequest uiRequest, DatasetDefinition dataset, ClaimsPrincipal? user = null);
}

public class AnalyticsQueryBuilder : IAnalyticsQueryBuilder
{
    private readonly ILogger<AnalyticsQueryBuilder> _logger;
    private readonly Dictionary<string, ITranslationStrategy> _strategies;

    public AnalyticsQueryBuilder(
        ILogger<AnalyticsQueryBuilder> logger,
        IEnumerable<ITranslationStrategy> strategies)
    {
        _logger = logger;
        
        // Register strategies by their type name for lookup
        _strategies = strategies.ToDictionary(
            s => s.GetType().Name.Replace("TranslationStrategy", "").ToLower(),
            s => s
        );
        
        // Fallback to EventTranslationStrategy if specific one not found
        if (!_strategies.ContainsKey("event"))
        {
            _logger.LogWarning("EventTranslationStrategy not registered, adding fallback");
        }
    }

    public AnalyticsQueryRequest Build(UiQueryRequest uiRequest, DatasetDefinition dataset, ClaimsPrincipal? user = null)
    {
        _logger.LogDebug("Building Cube.js query for dataset: {Dataset}", dataset.Id);

        var strategy = GetStrategy(dataset);

        var simpleFilters = strategy.TranslateFilters(uiRequest.Filters, dataset, user);
        var groupFilters = strategy.TranslateFilterGroups(uiRequest.FilterGroups, dataset);
        var allFilters = simpleFilters.Concat(groupFilters).ToArray();

        return new AnalyticsQueryRequest
        {
            Dataset = dataset.Id,
            Measures = strategy.TranslateMeasures(uiRequest.Kpis, dataset),
            Dimensions = strategy.TranslateDimensions(uiRequest.GroupBy, dataset),
            TimeDimensions = strategy.TranslateTimeDimensions(uiRequest.Filters, dataset),
            Filters = allFilters,
            Order = strategy.TranslateOrder(uiRequest.Sort, dataset),
            Limit = strategy.ApplyLimitPolicy(uiRequest.Page.Limit, dataset),
            Offset = uiRequest.Page.Offset
        };
    }

    private ITranslationStrategy GetStrategy(DatasetDefinition dataset)
    {
        // Determine strategy based on dataset ID prefix
        if (dataset.Id.StartsWith("events"))
        {
            return _strategies.GetValueOrDefault("event") ?? _strategies.First().Value;
        }
        if (dataset.Id.StartsWith("supplier"))
        {
            return _strategies.GetValueOrDefault("supplier") ?? _strategies.First().Value;
        }
        if (dataset.Id.StartsWith("item"))
        {
            return _strategies.GetValueOrDefault("item") ?? _strategies.First().Value;
        }

        // Default to event strategy
        return _strategies.GetValueOrDefault("event") ?? _strategies.First().Value;
    }
}
