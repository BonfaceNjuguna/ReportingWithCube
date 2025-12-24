// KPI view for RFIs. Exposes business KPIs from the RequestForInformation cube.
view('RequestForInformationView', {
  cubes: [
    {
      join_path: RequestForInformation,
      includes: `*`
    }
  ],

  preAggregations: {
    byCreatorMonthly: {
      measures: [
        RequestForInformation.count,
        RequestForInformation.invitedSuppliersCount,
        RequestForInformation.offeredSuppliersCount,
        RequestForInformation.responseRate
      ],
      dimensions: [
        RequestForInformation.createdBy,
        RequestForInformation.domain,
        StateRequestForInformation.name
      ],
      timeDimension: RequestForInformation.createdAt,
      granularity: `month`,
      refreshKey: {
        every: `1 hour`
      }
    }
  }
});
