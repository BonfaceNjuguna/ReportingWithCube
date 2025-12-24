// View exposing RequestForInformation cube for RFI events with all KPIs
view('EventsRfiView', {
  cubes: [
    {
      join_path: RequestForInformation,
      includes: '*'
    }
  ]
});
