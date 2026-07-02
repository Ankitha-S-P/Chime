package com.ankitha.chime.service;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;

@Service
public class SanitizationService {

    public String sanitize(String input) {
        if (input == null) return null;
        // Strip ALL HTML tags — plain text only for messages
        return Jsoup.clean(input, Safelist.none());
    }
}