import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

const MOODS = ["😔", "😢", "😤", "😰", "💔", "😌", "🤔", "😶", "🙃", "😊"];

export type SortOption = 'newest' | 'oldest' | 'mood';
export type TypeFilter = 'all' | 'audio' | 'text';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  moodFilter: string | null;
  onMoodFilterChange: (mood: string | null) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (type: TypeFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const SearchFilter = ({
  searchQuery,
  onSearchChange,
  moodFilter,
  onMoodFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortChange,
}: SearchFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveFilters = moodFilter !== null || typeFilter !== 'all';

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search confessions..."
          className="pl-10 pr-10 bg-secondary border-border"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSearchChange("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {(moodFilter ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 glass-effect border-border" align="start">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Filter by mood</p>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => onMoodFilterChange(null)}
                    className={`text-xs px-2 py-1 rounded transition-all ${
                      moodFilter === null ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    All
                  </button>
                  {MOODS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onMoodFilterChange(emoji)}
                      className={`text-lg p-1 rounded transition-all ${
                        moodFilter === emoji ? "bg-primary/20 scale-110" : "hover:bg-secondary"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Filter by type</p>
                <div className="flex gap-2">
                  {(['all', 'audio', 'text'] as TypeFilter[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => onTypeFilterChange(type)}
                      className={`text-xs px-3 py-1.5 rounded capitalize transition-all ${
                        typeFilter === type ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      {type === 'all' ? 'All' : type === 'audio' ? '🎤 Audio' : '✍️ Text'}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onMoodFilterChange(null);
                    onTypeFilterChange('all');
                  }}
                  className="w-full text-muted-foreground"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-32 bg-secondary border-border h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="mood">By mood</SelectItem>
          </SelectContent>
        </Select>

        {/* Active filter badges */}
        {moodFilter && (
          <Badge variant="secondary" className="gap-1">
            {moodFilter}
            <X
              className="w-3 h-3 cursor-pointer"
              onClick={() => onMoodFilterChange(null)}
            />
          </Badge>
        )}
        {typeFilter !== 'all' && (
          <Badge variant="secondary" className="gap-1 capitalize">
            {typeFilter}
            <X
              className="w-3 h-3 cursor-pointer"
              onClick={() => onTypeFilterChange('all')}
            />
          </Badge>
        )}
      </div>
    </div>
  );
};
