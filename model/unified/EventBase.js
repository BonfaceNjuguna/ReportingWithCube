// Unified event base combining RFQ + RFI with basic dimensions only
cube(`EventBase`, {
  sql: `
    SELECT
      id,
      'RFQ' AS event_type,
      "number" AS event_number,
      name,
      short_description,
      current_state_id,
      purchase_organisation::jsonb->>'Code' AS purchase_organisation,
      company_code::jsonb->>'Code' AS company_code,
      purchase_group::jsonb->>'Code' AS purchase_group,
      (commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName') AS commercial_contact,
      NULL AS technical_contact,
      (created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName') AS created_by,
      created_by::jsonb->>'UserId' AS created_by_user_id,
      created_by::jsonb->>'Department' AS creator_department,
      (updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName') AS updated_by,
      created_at,
      updated_at,
      started_date,
      deadline,
      replies_opened_at,
      (replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName') AS replies_opened_by,
      domain,
      currency,
      total_price,
      round_number,
      document_language,
      is_in_edit_mode,
      has_document_changed,
      has_deadline_changed
    FROM buyer_d_fdw_rfq_service.material_rfq

    UNION ALL

    SELECT
      id,
      'RFI' AS event_type,
      "number" AS event_number,
      name,
      short_description,
      current_state_id,
      NULL AS purchase_organisation,
      NULL AS company_code,
      NULL AS purchase_group,
      (commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName') AS commercial_contact,
      (technical_contact::jsonb->>'FirstName') || ' ' || (technical_contact::jsonb->>'LastName') AS technical_contact,
      (created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName') AS created_by,
      created_by::jsonb->>'UserId' AS created_by_user_id,
      created_by::jsonb->>'Department' AS creator_department,
      (updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName') AS updated_by,
      created_at,
      updated_at,
      started_date,
      deadline,
      replies_opened_at,
      (replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName') AS replies_opened_by,
      domain,
      NULL AS currency,
      NULL AS total_price,
      round_number,
      document_language,
      is_in_edit_mode,
      has_document_changed,
      has_deadline_changed
    FROM buyer_d_fdw_rfq_service.request_for_information
  `,

  measures: {
    count: {
      type: `count`,
      drillMembers: [eventNumber, name, createdAt, createdBy],
      description: `Total number of events (RFQ + RFI)`
    },

    rfqTotalPrice: {
      sql: `total_price`,
      type: `sum`,
      format: `currency`,
      filters: [{ sql: `${CUBE}.event_type = 'RFQ'` }],
      title: `RFQ Total Price`,
      description: `Total price sum for RFQ events only`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      description: `Unique identifier for the event`
    },

    eventType: {
      sql: `event_type`,
      type: `string`,
      title: `Event Type`,
      description: `Type of the event (RFQ or RFI)`
    },

    eventNumber: {
      sql: `event_number`,
      type: `string`,
      title: `Event Number`,
      description: `Human-readable number of the event`
    },

    name: {
      sql: `name`,
      type: `string`,
      title: `Event Name`,
      description: `Name assigned to the event`
    },

    shortDescription: {
      sql: `short_description`,
      type: `string`,
      description: `Brief description of the event`
    },

    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Status ID`,
      description: `ID of the current status of the event`
    },

    purchaseOrganisation: {
      sql: `purchase_organisation`,
      type: `string`,
      title: `Purchase Organisation`,
      description: `Code of the purchasing organization`
    },

    companyCode: {
      sql: `company_code`,
      type: `string`,
      title: `Company Code`,
      description: `Code of the company`
    },

    purchaseGroup: {
      sql: `purchase_group`,
      type: `string`,
      title: `Purchase Group`,
      description: `Code of the purchasing group`
    },

    commercialContact: {
      sql: `commercial_contact`,
      type: `string`,
      title: `Commercial Contact`,
      description: `Name of the commercial contact person`
    },

    technicalContact: {
      sql: `technical_contact`,
      type: `string`,
      title: `Technical Contact`,
      description: `Name of the technical contact person`
    },

    createdBy: {
      sql: `created_by`,
      type: `string`,
      title: `Created By`,
      description: `Name of the user who created the event`
    },

    createdByUserId: {
      sql: `created_by_user_id`,
      type: `string`,
      title: `Created By User ID`,
      description: `ID of the user who created the event`
    },

    creatorDepartment: {
      sql: `creator_department`,
      type: `string`,
      title: `Creator Department`,
      description: `Department of the user who created the event`
    },

    updatedBy: {
      sql: `updated_by`,
      type: `string`,
      description: `Name of the user who last updated the event`
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
      description: `Timestamp when the event was created`
    },

    updatedAt: {
      sql: `updated_at`,
      type: `time`,
      description: `Timestamp when the event was last updated`
    },

    startedDate: {
      sql: `started_date`,
      type: `time`,
      title: `Started/Published At`,
      description: `Timestamp when the event was started or published`
    },

    deadline: {
      sql: `deadline`,
      type: `time`,
      title: `Submission Deadline`,
      description: `Timestamp of the submission deadline`
    },

    repliesOpenedAt: {
      sql: `replies_opened_at`,
      type: `time`,
      title: `Replies Opened At`,
      description: `Timestamp when the replies were opened`
    },

    repliesOpenedBy: {
      sql: `replies_opened_by`,
      type: `string`,
      description: `Name of the user who opened the replies`
    },

    domain: {
      sql: `domain`,
      type: `string`,
      description: `Business domain of the event`
    },

    currency: {
      sql: `currency`,
      type: `string`,
      description: `Currency used in the event`
    },

    roundNumber: {
      sql: `round_number`,
      type: `number`,
      title: `Round Number`,
      description: `Current round number of the event`
    },

    documentLanguage: {
      sql: `document_language`,
      type: `string`,
      description: `Language of the event document`
    },

    isInEditMode: {
      sql: `is_in_edit_mode`,
      type: `boolean`,
      description: `Flag indicating if the event is currently in edit mode`
    },

    hasDocumentChanged: {
      sql: `has_document_changed`,
      type: `boolean`,
      description: `Flag indicating if the event document has changed`
    },

    hasDeadlineChanged: {
      sql: `has_deadline_changed`,
      type: `boolean`,
      description: `Flag indicating if the deadline has changed`
    }
  }
});
