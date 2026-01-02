using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using ReportingWithCube.Analytics.Models;
using ReportingWithCube.Analytics.Translation;
using ReportingWithCube.Analytics.Validation;
using ReportingWithCube.Analytics.Semantic;
using ReportingWithCube.Services;

namespace ReportingWithCube.Controllers;

/// <summary>
/// Analytics API - Generic query endpoint with translation layer
/// </summary>
[ApiController]
[Route("api/analytics/v1")]
public class AnalyticsController : ControllerBase
{
    private readonly IDatasetRegistry _datasetRegistry;
    private readonly IAnalyticsQueryValidator _validator;
    private readonly IAnalyticsQueryBuilder _queryBuilder;
    private readonly ICubeService _cubeService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IDatasetRegistry datasetRegistry,
        IAnalyticsQueryValidator validator,
        IAnalyticsQueryBuilder queryBuilder,
        ICubeService cubeService,
        ILogger<AnalyticsController> logger)
    {
        _datasetRegistry = datasetRegistry;
        _validator = validator;
        _queryBuilder = queryBuilder;
        _cubeService = cubeService;
        _logger = logger;
    }

    /// <summary>
    /// Execute an analytics query (main endpoint)
    /// </summary>
    [HttpPost("query")]
    public async Task<ActionResult<AnalyticsQueryResponse>> ExecuteQuery([FromBody] UiQueryRequest request)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            _logger.LogInformation("Analytics query for dataset: {Dataset}", request.DatasetId);

            var dataset = _datasetRegistry.GetDataset(request.DatasetId);
            if (dataset == null)
            {
                return NotFound(new { error = $"Dataset '{request.DatasetId}' not found" });
            }

            _validator.Validate(request, dataset, User);
            var cubeQuery = _queryBuilder.Build(request, dataset, User);
            var cubeResult = await _cubeService.ExecuteQueryAsync(cubeQuery);
            var response = BuildResponse(cubeResult, dataset, stopwatch.ElapsedMilliseconds);

            return Ok(response);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Query validation failed");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing analytics query");
            return StatusCode(500, new { error = "Failed to execute query", details = ex.Message });
        }
    }

    /// <summary>
    /// Get schema metadata for a dataset (for building UI)
    /// </summary>
    [HttpGet("schema/{datasetId}")]
    public ActionResult GetSchema(string datasetId)
    {
        try
        {
            var dataset = _datasetRegistry.GetDataset(datasetId);
            if (dataset == null)
            {
                return NotFound(new { error = $"Dataset '{datasetId}' not found" });
            }

            var schema = new
            {
                dataset.Id,
                dataset.Label,
                measures = dataset.Measures
                    .Where(m => !m.Value.Hidden)
                    .Select(m => new
                    {
                        id = m.Key,
                        m.Value.Label,
                        m.Value.Type,
                        m.Value.Format
                    }),
                dimensions = dataset.Dimensions.Select(d => new
                {
                    id = d.Key,
                    d.Value.Label,
                    d.Value.Type
                }),
                filters = dataset.Filters.Select(f => new
                {
                    id = f.Key,
                    type = f.Value.Type.ToString().ToLower(),
                    operators = f.Value.AllowedOperators
                })
            };

            return Ok(schema);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting schema");
            return StatusCode(500, new { error = "Failed to get schema" });
        }
    }

    /// <summary>
    /// Get all available datasets
    /// </summary>
    [HttpGet("datasets")]
    public ActionResult GetDatasets()
    {
        try
        {
            var datasets = _datasetRegistry.GetAllDatasets()
                .Select(d => new
                {
                    d.Id,
                    d.Label
                });

            return Ok(datasets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting datasets");
            return StatusCode(500, new { error = "Failed to get datasets" });
        }
    }

    /// <summary>
    /// Get Cube.js metadata (raw, for advanced use)
    /// </summary>
    [HttpGet("meta")]
    public async Task<ActionResult> GetCubeMeta()
    {
        try
        {
            var meta = await _cubeService.GetMetaAsync();
            return Ok(meta);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Cube.js metadata");
            return StatusCode(500, new { error = "Failed to get metadata" });
        }
    }

    private AnalyticsQueryResponse BuildResponse(System.Text.Json.JsonElement cubeResult, DatasetDefinition dataset, long executionMs)
    {
        // Check if it's an array (the data array)
        if (cubeResult.ValueKind == System.Text.Json.JsonValueKind.Array)
        {
            var data = cubeResult.EnumerateArray().ToArray();
            var columns = ExtractColumns(data, dataset);

            return new AnalyticsQueryResponse
            {
                Data = data,
                Columns = columns,
                Query = new QueryMetadata
                {
                    Dataset = dataset.Id,
                    RowCount = data.Length,
                    ExecutionTimeMs = executionMs,
                    FromCache = false
                }
            };
        }

        return new AnalyticsQueryResponse
        {
            Data = Array.Empty<System.Text.Json.JsonElement>(),
            Columns = Array.Empty<ColumnMetadata>(),
            Query = new QueryMetadata
            {
                Dataset = dataset.Id,
                RowCount = 0,
                ExecutionTimeMs = executionMs,
                FromCache = false
            }
        };
    }

    private ColumnMetadata[] ExtractColumns(System.Text.Json.JsonElement[] data, DatasetDefinition dataset)
    {
        if (data.Length == 0) return Array.Empty<ColumnMetadata>();

        var firstRow = data[0];
        if (firstRow.ValueKind != System.Text.Json.JsonValueKind.Object) return Array.Empty<ColumnMetadata>();

        var columns = new List<ColumnMetadata>();

        foreach (var prop in firstRow.EnumerateObject())
        {
            var cubeMember = prop.Name;
            var (label, type) = GetFriendlyMetadata(cubeMember, dataset);

            columns.Add(new ColumnMetadata
            {
                Name = cubeMember,
                Label = label,
                Type = type
            });
        }

        return columns.ToArray();
    }

    private (string label, string type) GetFriendlyMetadata(string cubeMember, DatasetDefinition dataset)
    {
        foreach (var measure in dataset.Measures)
        {
            if (measure.Value.CubeMember == cubeMember)
            {
                return (measure.Value.Label, measure.Value.Type);
            }
        }

        foreach (var dimension in dataset.Dimensions)
        {
            if (dimension.Value.CubeMember == cubeMember)
            {
                return (dimension.Value.Label, dimension.Value.Type);
            }
        }

        return (cubeMember, "string");
    }

    private class CubeLoadResult
    {
        public System.Text.Json.JsonElement[]? Data { get; set; }
    }
}
