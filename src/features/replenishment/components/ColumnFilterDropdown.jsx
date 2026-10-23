import { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

export default function ColumnFilterDropdown({
  title,
  options = [],
  selectedValues = [],
  currentSort = null,
  sortOptions = [
    { key: 'asc', label: 'Sort A to Z' },
    { key: 'desc', label: 'Sort Z to A' },
  ],
  onApply,
  onClear,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftSelected, setDraftSelected] = useState(selectedValues);
  const [draftSort, setDraftSort] = useState(currentSort);
  const [searchValue, setSearchValue] = useState('');
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const handleToggleOpen = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      setDraftSelected(selectedValues);
      setDraftSort(currentSort);
      setSearchValue('');
    }
    setIsOpen((prev) => !prev);
  };

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) return options;
    const q = searchValue.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchValue]);

  const handleToggleOption = (val) => {
    setDraftSelected((prev) => {
      if (prev.includes(val)) {
        return prev.filter((v) => v !== val);
      }
      return [...prev, val];
    });
  };

  const handleSelectAll = () => {
    setDraftSelected(options.map((opt) => opt.value));
  };

  const handleClearSelection = () => {
    setDraftSelected([]);
    if (onClear) {
      onClear();
    }
  };

  const handleApplyClick = () => {
    onApply({
      selectedValues: draftSelected,
      sort: draftSort,
    });
    setIsOpen(false);
  };

  const handleCancelClick = () => {
    setIsOpen(false);
  };

  const isFilteredOrSorted =
    (selectedValues && selectedValues.length > 0) || Boolean(currentSort);

  return (
    <div className="col-filter-header-wrap">
      <span className="col-filter-title">{title}</span>
      <button
        ref={buttonRef}
        type="button"
        className={`col-filter-trigger-btn ${isFilteredOrSorted ? 'active' : ''} ${isOpen ? 'open' : ''}`}
        onClick={handleToggleOpen}
        aria-label={`Filter and sort ${title}`}
        title={`Filter and sort by ${title}`}
      >
        {/* Spreadsheet-style 3 horizontal lines / funnel filter icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="10" y1="18" x2="14" y2="18" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="col-filter-popover"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Sort Section */}
          {sortOptions.length > 0 && (
            <div className="col-filter-sort-section">
              {sortOptions.map((so) => (
                <button
                  key={so.key}
                  type="button"
                  className={`col-filter-sort-item ${draftSort === so.key ? 'active' : ''}`}
                  onClick={() => setDraftSort((prev) => (prev === so.key ? null : so.key))}
                >
                  <span className="col-filter-sort-radio">
                    {draftSort === so.key ? '●' : '○'}
                  </span>
                  <span>{so.label}</span>
                </button>
              ))}
            </div>
          )}

          {sortOptions.length > 0 && options.length > 0 && (
            <div className="col-filter-divider" />
          )}

          {/* 2. Filter by values section */}
          {options.length > 0 && (
            <div className="col-filter-values-section">
              <div className="col-filter-values-header">
                <span className="col-filter-section-title">Filter by values</span>
                <div className="col-filter-quick-links">
                  <button type="button" onClick={handleSelectAll} className="col-filter-link-btn">
                    Select all
                  </button>
                  <span className="col-filter-link-dot">·</span>
                  <button type="button" onClick={handleClearSelection} className="col-filter-link-btn">
                    Clear
                  </button>
                </div>
              </div>

              {/* Search box */}
              <div className="col-filter-search-box">
                <input
                  type="text"
                  placeholder="Search values..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="col-filter-search-input"
                  autoFocus
                />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="col-filter-search-ic">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* Checkbox list */}
              <div className="col-filter-options-list">
                {filteredOptions.length === 0 ? (
                  <div className="col-filter-no-results">No matches</div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isChecked = draftSelected.includes(opt.value);
                    return (
                      <label key={opt.value} className="col-filter-option-item">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOption(opt.value)}
                          className="col-filter-cb"
                        />
                        <span className="col-filter-option-label">{opt.label}</span>
                        {opt.count !== undefined && (
                          <span className="col-filter-option-count">({opt.count})</span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 3. Action buttons (Cancel / OK) */}
          <div className="col-filter-footer">
            <button
              type="button"
              className="col-filter-btn-cancel"
              onClick={handleCancelClick}
            >
              Cancel
            </button>
            <button
              type="button"
              className="col-filter-btn-ok"
              onClick={handleApplyClick}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ColumnFilterDropdown.propTypes = {
  title: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
    })
  ),
  selectedValues: PropTypes.array,
  currentSort: PropTypes.string,
  sortOptions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  onApply: PropTypes.func.isRequired,
  onClear: PropTypes.func,
};
