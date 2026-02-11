package com.tennismatch.backend.services;

public final class EmailTemplates {

    private EmailTemplates() {}

    public static String notificationHtml(String projectName,
                                          String heading,
                                          String message,
                                          String ctaUrl,
                                          String ctaLabel) {
        return """
            <div style="font-family:Arial,sans-serif;background:#f6f7f9;padding:24px">
              <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:24px">
                <div style="font-size:20px;font-weight:700;color:#101418;margin-bottom:10px">%s</div>
                <div style="font-size:15px;line-height:1.5;color:#3b4147;margin-bottom:18px">%s</div>
                <a href="%s"
                   style="display:inline-block;padding:12px 20px;background:#0E5628;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700">
                  %s
                </a>
                <div style="margin-top:20px;font-size:12px;color:#7a828a">
                  If the button does not work, copy and paste this link into your browser:<br/>
                  <span>%s</span>
                </div>
              </div>
              <div style="max-width:560px;margin:10px auto 0 auto;font-size:12px;color:#9aa2a9;text-align:center">
                %s
              </div>
            </div>
        """.formatted(heading, message, ctaUrl, ctaLabel, ctaUrl, projectName);
    }
}
