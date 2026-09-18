package com.snd.dto.voip;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoipRedeemRequest {
    @NotBlank(message = "Card PIN is required")
    private String pin;

    private String serialNumber;

    @NotBlank(message = "VoIP Subscriber number is required")
    private String subscriberNumber;
}
