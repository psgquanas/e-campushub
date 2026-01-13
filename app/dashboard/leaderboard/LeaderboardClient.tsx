"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconTrophy,
  IconMedal,
  IconCrown,
  IconStar,
  IconFlame,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileImageDialog } from "@/components/ProfileImageDialog";

interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  points: number;
  programme: { name: string } | null;
  currentLevel: number | null;
}

interface CurrentUser extends LeaderboardUser {
  rank: number;
}

export default function LeaderboardClient({
  leaderboard,
  currentUser,
  initialFilter = "all",
}: {
  leaderboard: LeaderboardUser[];
  currentUser: CurrentUser;
  initialFilter?: "all" | "programme" | "level";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "programme" | "level">(
    initialFilter
  );

  const handleFilterChange = (value: "all" | "programme" | "level") => {
    setFilter(value);
    const params = new URLSearchParams();
    if (value !== "all") {
      params.set("filter", value);
    }
    startTransition(() => {
      router.push(`/dashboard/leaderboard?${params.toString()}`);
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <IconCrown className="size-6 text-yellow-500" />;
      case 2:
        return <IconMedal className="size-6 text-gray-400" />;
      case 3:
        return <IconMedal className="size-6 text-amber-700" />;
      default:
        return (
          <span className="text-lg font-bold text-muted-foreground">
            #{rank}
          </span>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 Champion</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 Runner Up</Badge>;
    if (rank === 3)
      return <Badge className="bg-amber-700">🥉 Third Place</Badge>;
    if (rank <= 10) return <Badge variant="secondary">Top 10</Badge>;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <IconTrophy className="size-6 sm:size-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Compete with your peers and climb the ranks!
          </p>
        </div>

        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="programme">My Programme</SelectItem>
            <SelectItem value="level">My Level</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current User Stats */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <ProfileImageDialog
                image={currentUser.image}
                name={currentUser.name}
              >
                <Avatar className="size-12 sm:size-16">
                  <AvatarImage src={currentUser.image || undefined} />
                  <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
              </ProfileImageDialog>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  {currentUser.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Your Rank
                </p>
              </div>
            </div>
            <div className="flex items-center justify-around sm:justify-end gap-6 sm:gap-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">
                  #{currentUser.rank}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Rank</p>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold flex items-center gap-1">
                  <IconStar className="size-5 sm:size-6 text-yellow-500" />
                  {currentUser.points}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Points
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-4">
              {/* Skeleton Loading State */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 border rounded-xl"
                >
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[40%]" />
                    <Skeleton className="h-4 w-[25%]" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Limit to top 15 */}
              {leaderboard.slice(0, 15).map((user, index) => {
                const rank = index + 1;
                const isCurrentUser = user.id === currentUser.id;
                const isFirstPlace = rank === 1;

                // First place gets special treatment
                if (isFirstPlace) {
                  return (
                    <div
                      key={user.id}
                      className="relative overflow-hidden rounded-xl mb-3 bg-linear-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 border-2 border-yellow-500/50 shadow-xl"
                    >
                      {/* Content Container */}
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-6">
                        {/* Avatar with Crown */}
                        <div className="relative shrink-0">
                          <ProfileImageDialog
                            image={user.image}
                            name={user.name}
                          >
                            <Avatar className="size-12 sm:size-20 ring-2 sm:ring-4 ring-yellow-500/50 shadow-xl">
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback className="text-lg sm:text-3xl font-bold bg-linear-to-br from-yellow-400 to-yellow-600 text-white">
                                {user.name[0]}
                              </AvatarFallback>
                            </Avatar>
                          </ProfileImageDialog>
                          {/* Crown Badge */}
                          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                            <div className="flex items-center justify-center w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 shadow-lg ring-2 sm:ring-4 ring-background">
                              <IconCrown className="size-4 sm:size-7 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-base sm:text-xl truncate">
                              {user.name}
                            </h4>
                            {isCurrentUser && (
                              <Badge
                                variant="default"
                                className="text-xs px-2 py-0"
                              >
                                You
                              </Badge>
                            )}
                            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs px-2 py-0">
                              🥇 Champion
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {user.programme?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Level {user.currentLevel}
                          </p>
                        </div>

                        {/* Points */}
                        <div className="flex flex-col items-end shrink-0 ml-2">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <IconStar className="size-5 sm:size-7 text-yellow-500 fill-yellow-500" />
                            <span className="text-2xl sm:text-4xl font-bold bg-linear-to-br from-yellow-600 to-yellow-700 bg-clip-text text-transparent">
                              {user.points}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide mt-0.5 sm:mt-1">
                            points
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Entries 2-5 (always visible)
                if (rank <= 5) {
                  return (
                    <div
                      key={user.id}
                      className={`relative overflow-hidden rounded-xl mb-3 transition-all ${
                        isCurrentUser
                          ? "bg-linear-to-r from-primary/20 to-primary/10 border-2 border-primary shadow-lg"
                          : rank <= 3
                            ? "bg-linear-to-r from-accent to-background border border-border shadow-sm"
                            : "bg-muted/50 border border-border hover:border-primary/50 hover:shadow-sm"
                      }`}
                    >
                      {/* Content Container */}
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                        {/* Avatar with Rank Badge */}
                        <div className="relative shrink-0">
                          <ProfileImageDialog
                            image={user.image}
                            name={user.name}
                          >
                            <Avatar className="size-10 sm:size-12 ring-2 ring-background shadow-md cursor-pointer hover:opacity-90 transition-opacity">
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback className="font-bold bg-muted text-muted-foreground">
                                {user.name[0]}
                              </AvatarFallback>
                            </Avatar>
                          </ProfileImageDialog>

                          {/* Small Rank Badge on Image */}
                          <div className="absolute -top-2 -left-2 z-10">
                            <div
                              className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full font-bold text-xs ring-2 ring-background shadow-sm ${
                                rank <= 3
                                  ? "bg-linear-to-br from-yellow-400 to-yellow-900 text-white"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {rank <= 3 ? getRankIcon(rank) : `#${rank}`}
                            </div>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-sm sm:text-base truncate">
                              {user.name}
                            </h4>
                            {isCurrentUser && (
                              <Badge
                                variant="default"
                                className="text-xs px-2 py-0"
                              >
                                You
                              </Badge>
                            )}
                            {rank <= 3 && getRankBadge(rank)}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {user.programme?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Level {user.currentLevel}
                          </p>
                        </div>

                        {/* Points */}
                        <div className="flex flex-col items-end shrink-0 ml-2">
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <IconStar className="size-4 sm:size-5 text-yellow-500 fill-yellow-500" />
                            <span className="text-xl sm:text-2xl font-bold bg-linear-to-br from-yellow-600 to-yellow-700 bg-clip-text text-transparent">
                              {user.points}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            points
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Entries 6-15 (scrollable section) - rendered below
                return null;
              })}

              {/* Scrollable section for entries 6-15 */}
              {leaderboard.length > 5 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span className="px-2">More Contributors</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                    {leaderboard.slice(5, 15).map((user, index) => {
                      const rank = index + 6; // Start from 6
                      const isCurrentUser = user.id === currentUser.id;

                      return (
                        <div
                          key={user.id}
                          className={`relative overflow-hidden rounded-xl transition-all ${
                            isCurrentUser
                              ? "bg-linear-to-r from-primary/20 to-primary/10 border-2 border-primary shadow-lg"
                              : "bg-muted/50 border border-border hover:border-primary/50 hover:shadow-sm"
                          }`}
                        >
                          {/* Content Container */}
                          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                            {/* Avatar with Rank Badge */}
                            <div className="relative shrink-0">
                              <ProfileImageDialog
                                image={user.image}
                                name={user.name}
                              >
                                <Avatar className="size-10 sm:size-12 ring-2 ring-background shadow-md cursor-pointer hover:opacity-90 transition-opacity">
                                  <AvatarImage src={user.image || undefined} />
                                  <AvatarFallback className="font-bold bg-muted text-muted-foreground">
                                    {user.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                              </ProfileImageDialog>

                              {/* Small Rank Badge on Image */}
                              <div className="absolute -top-2 -left-2 z-10">
                                <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full font-bold text-xs ring-2 ring-background shadow-sm bg-muted text-muted-foreground border border-border">
                                  #{rank}
                                </div>
                              </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-bold text-sm sm:text-base truncate">
                                  {user.name}
                                </h4>
                                {isCurrentUser && (
                                  <Badge
                                    variant="default"
                                    className="text-xs px-2 py-0"
                                  >
                                    You
                                  </Badge>
                                )}
                                {rank <= 10 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs px-2 py-0"
                                  >
                                    Top 10
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {user.programme?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Level {user.currentLevel}
                              </p>
                            </div>

                            {/* Points */}
                            <div className="flex flex-col items-end shrink-0 ml-2">
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <IconStar className="size-4 sm:size-5 text-yellow-500 fill-yellow-500" />
                                <span className="text-xl sm:text-2xl font-bold bg-linear-to-br from-yellow-600 to-yellow-700 bg-clip-text text-transparent">
                                  {user.points}
                                </span>
                              </div>
                              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                points
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Points Guide */}
      <Card>
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10">
                <IconFlame className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Upload Material</p>
                <p className="text-sm text-muted-foreground">+10 points</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-500/10">
                <IconTrophy className="size-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Material Approved</p>
                <p className="text-sm text-muted-foreground">+50 points</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/10">
                <IconStar className="size-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Material Downloaded</p>
                <p className="text-sm text-muted-foreground">+2 points each</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-orange-500/10">
                <IconMedal className="size-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Daily Login</p>
                <p className="text-sm text-muted-foreground">+5 points</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
