// KPI layer for events, exposing unified metrics from EventBase cube.
view('EventsView', {
  cubes: [
    {
      join_path: EventBase,
      includes: `*`
    }
  ],

  preAggregations: {
    comprehensive: {
      measures: [
        EventBase.invitedSuppliersCount,
        EventBase.offeredSuppliersCount,
        EventBase.viewedSuppliersCount,
        EventBase.rejectedSuppliersCount,
        EventBase.quotationTotal,
        EventBase.quotationCountValid
      ],
      dimensions: [
        EventBase.number,
        EventBase.createdBy,
        EventBase.currentStateId,
        EventBase.purchaseOrganisation,
        EventBase.eventType
      ],
      timeDimension: EventBase.createdAt,
      granularity: `day`,
      refreshKey: {
        every: `1 hour`
      }
    },

    byCreator: {
      measures: [
        EventBase.invitedSuppliersCount,
        EventBase.offeredSuppliersCount
      ],
      dimensions: [EventBase.createdBy],
      timeDimension: EventBase.createdAt,
      granularity: `month`
    }
  }
});
