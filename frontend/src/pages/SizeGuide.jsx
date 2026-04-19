import { useState } from 'react'
import { Ruler, Info } from 'lucide-react'

function SizeGuide() {
  const [activeMeasurement, setActiveMeasurement] = useState(null)

  // Unified size chart - applies to both Churidhar Sets and Western Wear
  const sizeChart = {
    M: { 
      Bust: '84-88 cm', 
      Waist: '68-72 cm', 
      Hip: '92-96 cm' 
    },
    L: { 
      Bust: '88-92 cm', 
      Waist: '72-76 cm', 
      Hip: '96-100 cm' 
    },
    XL: { 
      Bust: '92-96 cm', 
      Waist: '76-80 cm', 
      Hip: '100-104 cm' 
    },
    XXL: { 
      Bust: '96-100 cm', 
      Waist: '80-84 cm', 
      Hip: '104-108 cm' 
    }
  }

  // Bottom measurements for Churidhar
  const bottomMeasurements = {
    M: { 
      Waist: '68-72 cm', 
      Hip: '92-96 cm', 
      Length: '95-100 cm' 
    },
    L: { 
      Waist: '72-76 cm', 
      Hip: '96-100 cm', 
      Length: '100-105 cm' 
    },
    XL: { 
      Waist: '76-80 cm', 
      Hip: '100-104 cm', 
      Length: '105-110 cm' 
    },
    XXL: { 
      Waist: '80-84 cm', 
      Hip: '104-108 cm', 
      Length: '110-115 cm' 
    }
  }

  const measurementPoints = [
    {
      id: 'bust',
      label: 'Bust',
      position: { top: '33%', left: '50%' },
      description: 'Measure around the fullest part of your chest, keeping the tape measure level and parallel to the floor.'
    },
    {
      id: 'waist',
      label: 'Waist',
      position: { top: '48%', left: '50%' },
      description: 'Measure around the narrowest part of your waist, usually just above the belly button. Keep the tape snug but not tight.'
    },
    {
      id: 'hip',
      label: 'Hip',
      position: { top: '63%', left: '50%' },
      description: 'Measure around the fullest part of your hips, usually 7-9 inches below your waist. Stand with feet together.'
    }
  ]

  return (
    <div className="size-guide-page-new">
      <div className="container">
        <div className="size-guide-header">
          <h1>Size Guide</h1>
          <p className="page-intro">
            Use our size guide to find the perfect fit. All measurements are in centimeters (cm).
            If you're between sizes, we recommend sizing up.
          </p>
        </div>

        {/* Measurement Instructions */}
        <div className="visual-measurement-section">
          <h2>How to Measure</h2>
          <div className="measurement-instructions">
            {measurementPoints.map((point) => (
              <div
                key={point.id}
                className={`instruction-item ${activeMeasurement === point.id ? 'active' : ''}`}
                onMouseEnter={() => setActiveMeasurement(point.id)}
                onMouseLeave={() => setActiveMeasurement(null)}
              >
                <div className="instruction-icon">
                  <Ruler size={20} />
                </div>
                <div className="instruction-content">
                  <h3>{point.label}</h3>
                  <p>{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unified Size Chart */}
        <div className="size-chart-section">
          <div className="size-chart-header">
            <h2>Size Chart</h2>
            <p className="chart-subtitle">
              This size chart applies to <strong>Churidhar Sets</strong> (Kurti, 2-piece, 3-piece) and <strong>Western Wear</strong> (Crop Top, Short Kurti, Long Gown, Short Gown)
            </p>
          </div>

          <div className="size-table-wrapper">
            <table className="size-table-unified">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Bust (cm)</th>
                  <th>Waist (cm)</th>
                  <th>Hip (cm)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sizeChart).map(([size, measurements]) => (
                  <tr key={size}>
                    <td><strong>{size}</strong></td>
                    <td>{measurements.Bust}</td>
                    <td>{measurements.Waist}</td>
                    <td>{measurements.Hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Measurements for Churidhar */}
        <div className="bottom-measurements-section">
          <div className="section-header-with-icon">
            <Info size={20} />
            <h2>Bottom Measurements (Churidhar Sets)</h2>
          </div>
          <p className="section-note">
            For churidhar sets (2-piece and 3-piece), use these measurements for the bottom piece:
          </p>

          <div className="size-table-wrapper">
            <table className="size-table-unified">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Waist (cm)</th>
                  <th>Hip (cm)</th>
                  <th>Length (cm)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(bottomMeasurements).map(([size, measurements]) => (
                  <tr key={size}>
                    <td><strong>{size}</strong></td>
                    <td>{measurements.Waist}</td>
                    <td>{measurements.Hip}</td>
                    <td>{measurements.Length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product-Specific Notes */}
        <div className="size-notes-section">
          <h2>Size Notes by Product Type</h2>
          <div className="notes-grid">
            <div className="note-card">
              <h3>Churidhar Sets</h3>
              <ul>
                <li>For <strong>Kurti/Top</strong>: Use Bust, Waist measurements</li>
                <li>For <strong>Bottom/Churidhar</strong>: Use Bottom Measurements table above</li>
                <li>2-piece sets: Top + Bottom</li>
                <li>3-piece sets: Top + Bottom + Dupatta (one-size)</li>
              </ul>
            </div>

            <div className="note-card">
              <h3>Western Wear</h3>
              <ul>
                <li><strong>Crop Top</strong>: Focus on Bust and Waist measurements</li>
                <li><strong>Short Kurti</strong>: Use Bust, Waist measurements</li>
                <li><strong>Long Gown</strong>: Use all measurements (Bust, Waist, Hip)</li>
                <li><strong>Short Gown</strong>: Use Bust, Waist, Hip measurements</li>
              </ul>
            </div>

            <div className="note-card">
              <h3>Sarees</h3>
              <ul>
                <li>Sarees come in standard length (5.5m - 6m)</li>
                <li>No size selection needed for saree length</li>
                <li>One-size fits all</li>
              </ul>
            </div>

            <div className="note-card">
              <h3>General Tips</h3>
              <ul>
                <li>Wear form-fitting clothing when measuring</li>
                <li>Keep the tape measure snug but not tight</li>
                <li>If you're between sizes, we recommend sizing up</li>
                <li>For loose-fit items, you may size down</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="size-help-section">
          <h2>Need Help Finding Your Size?</h2>
          <p>If you're unsure about your size, our customer service team is here to help!</p>
          <div className="help-actions">
            <a href="mailto:support@arudhrafashions.com" className="btn btn-primary">
              Contact Us
            </a>
            <a href="/contact" className="btn btn-outline">
              Get Help
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SizeGuide
