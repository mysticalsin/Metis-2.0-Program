# LESSON-002 — A visual control hidden by state must actually be hidden

During kit browser rendering, a display:grid rule overrode the browser's hidden-attribute display behavior and exposed both Stop and Send. The lab now enforces [hidden] display:none, and the browser suite checks exclusive state controls. Prevention: test real computed visibility, not just whether a hidden attribute exists.

This was fixed in the synthetic lab; no assertion is made about the production app's CSS.
