package com.snd.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDto {
    private String companyName;
    private String companyAddress;
    private String companyPhone;
    private String companyEmail;
    private SalesOrderResponse order;
}
