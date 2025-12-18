import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Sponsored
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full rounded-md bg-muted/50 flex items-center justify-center border border-dashed">
          <p className="text-sm text-muted-foreground">Ad Space</p>
        </div>
      </CardContent>
    </Card>
  );
}
