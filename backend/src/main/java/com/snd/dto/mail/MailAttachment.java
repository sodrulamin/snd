package com.snd.dto.mail;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.InputStreamSource;

import java.io.File;

/**
 * Encapsulates an optional email attachment.
 * Supports raw bytes, local Files, and generic Spring InputStreamSources.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MailAttachment {

    private String filename;
    private InputStreamSource source;
    private String contentType;

    public static MailAttachment of(String filename, byte[] content) {
        return MailAttachment.builder()
                .filename(filename)
                .source(new ByteArrayResource(content))
                .build();
    }

    public static MailAttachment of(String filename, byte[] content, String contentType) {
        return MailAttachment.builder()
                .filename(filename)
                .source(new ByteArrayResource(content))
                .contentType(contentType)
                .build();
    }

    public static MailAttachment of(File file) {
        return of(file.getName(), file);
    }

    public static MailAttachment of(String filename, File file) {
        return MailAttachment.builder()
                .filename(filename)
                .source(new FileSystemResource(file))
                .build();
    }

    public static MailAttachment of(String filename, InputStreamSource source, String contentType) {
        return MailAttachment.builder()
                .filename(filename)
                .source(source)
                .contentType(contentType)
                .build();
    }
}