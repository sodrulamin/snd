package com.snd.dto.campaign;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCampaignExpenseRequest {
    @NotBlank(message = "Campaign / Purpose name is required")
    private String campaignName;

    @NotBlank(message = "Purpose category is required (CAMPAIGN, INTERNAL_USE, etc.)")
    private String purposeCategory;

    @NotNull(message = "Campaign start date is required")
    private LocalDate startDate;

    @NotNull(message = "Campaign end date is required")
    private LocalDate endDate;

    private String referenceNo;

    private String beneficiaryDept;

    private LocalDateTime disbursedAt;

    private String notes;

    private List<CampaignExpenseItemRequest> items;
}
