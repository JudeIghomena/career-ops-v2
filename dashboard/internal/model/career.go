package model

// CareerApplication represents a single job application from the tracker.
type CareerApplication struct {
	Number       int
	Date         string
	Company      string
	Role         string
	Status       string
	Score        float64
	ScoreRaw     string
	HasPDF       bool
	ReportPath   string
	ReportJSONPath string // path to machine-readable .json sidecar (may be empty)
	ReportNumber string
	Notes        string
	JobURL       string // URL of the original job posting
	CVVersion    string // git SHA of cv.md at evaluation time
	FollowupDate string // YYYY-MM-DD or empty
	// Enrichment (lazy loaded from report — prefer JSON sidecar over markdown regex)
	Archetype    string
	TlDr         string
	Remote       string
	CompEstimate string
	Keywords     []string
	Gaps         []string
}

// ReportJSON mirrors the JSON sidecar written alongside each .md report.
// Schema defined in modes/oferta.md — "Save JSON Report" section.
type ReportJSON struct {
	Num        string   `json:"num"`
	Date       string   `json:"date"`
	Company    string   `json:"company"`
	Role       string   `json:"role"`
	URL        string   `json:"url"`
	Archetype  string   `json:"archetype"`
	Score      float64  `json:"score"`
	Status     string   `json:"status"`
	HasPDF     bool     `json:"has_pdf"`
	ReportPath string   `json:"report_path"`
	CVVersion  string   `json:"cv_version"`
	TlDr       string   `json:"tldr"`
	Remote     string   `json:"remote"`
	Comp       string   `json:"comp"`
	Keywords   []string `json:"keywords"`
	Gaps       []string `json:"gaps"`
	Followup   string   `json:"followup_date"`
	Notes      string   `json:"notes"`
}

// PipelineMetrics holds aggregate stats for the pipeline dashboard.
type PipelineMetrics struct {
	Total      int
	ByStatus   map[string]int
	AvgScore   float64
	TopScore   float64
	WithPDF    int
	Actionable int
}
