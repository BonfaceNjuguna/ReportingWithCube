// KPI view for Material RFQs. Exposes business KPIs from the MaterialRfq cube.
view('MaterialRfqView', {
  cubes: [
    {
      join_path: MaterialRfq,
      includes: `*`
    }
  ],

  preAggregations: {
    byCreatorMonthly: {
      measures: [
        MaterialRfq.count,
        MaterialRfq.invitedSuppliersCount,
        MaterialRfq.offeredSuppliersCount,
        MaterialRfq.quotationRate,
        MaterialRfq.bestQuotationTotal,
        MaterialRfq.quotationTotal,
        MaterialRfq.quotationTotalAvg
      ],
      dimensions: [
        MaterialRfq.createdBy,
        MaterialRfq.purchaseOrganisation,
        StateMaterialRfq.name
      ],
      timeDimension: MaterialRfq.createdAt,
      granularity: `month`,
      refreshKey: {
        every: `1 hour`
      }
    }
  }
});
