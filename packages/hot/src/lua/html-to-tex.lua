-- This filter is intentionally dumb.
-- It does NOT parse or validate content.
-- It only unwraps data-raw verbatim to guarantee byte-level equality.

function has_class(elem, cls)
  if not elem.classes then return false end
  for _, c in ipairs(elem.classes) do
    if c == cls then
      return true
    end
  end
  return false
end

function Span(elem)
  -- Exact class match required
  if not has_class(elem, "hot-protect") then
    return nil
  end

  -- Pandoc strips "data-" prefix from HTML attributes
  local raw_tex = elem.attributes["data-raw"] or elem.attributes["raw"]

  if raw_tex then
    -- Contract: If data-raw exists, it is the Single Source of Truth for this span.
    -- Inner content is ignored. No trimming, no parsing.
    return pandoc.RawInline("tex", raw_tex)
  else
    -- Fallback: If data-raw is missing, pass through.
    -- We return the content (inlines) to effectively "unwrap" the span.
    return elem.content
  end
end
