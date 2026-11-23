import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import useTransformers from "@/hooks/useTransformers";
import Dashboard from "./Dashboard";

function BackButton() {
  return (
    <Link to="/" className="inline-block">
      <Button variant="outline" size="sm" className="mb-4 gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Transformers
      </Button>
    </Link>
  );
}

export default function TransformerDetails() {
  const { id } = useParams();
  const { transformer, loading, toggleArmed, toggleMode } = useTransformers( id );

  if ( loading ) {
    return (
      <main className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-muted-foreground">Loading transformer details...</p>
      </main>
    );
  }

  if ( !transformer ) {
    return (
      <main className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-muted-foreground">Transformer not found.</p>
        <Link
          to="/"
          className="mt-3 inline-block text-primary underline"
        >
          Back to Transformers
        </Link>
      </main>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl">
        <BackButton />
      </div>
      <Dashboard
        transformer={transformer}
        onToggleArmed={( currentArmed ) => toggleArmed( transformer.id, currentArmed )}
        onToggleMode={( currentMode ) => toggleMode( transformer.id, currentMode )}
      />
    </div>
  );
}
