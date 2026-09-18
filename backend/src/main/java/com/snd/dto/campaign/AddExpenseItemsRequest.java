package com.snd.dto.campaign;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddExpenseItemsRequest {
    @NotEmpty(message = "At least one card range must be added")
    private List<CampaignExpenseItemRequest> items;
}
