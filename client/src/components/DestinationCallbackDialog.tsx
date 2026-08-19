import { useState } from "react";
import { PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type DestinationCallbackDialogProps = {
  destination: string;
  procedure: string;
};

export function DestinationCallbackDialog({ destination, procedure }: DestinationCallbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("09:00–11:00");
  const minimumDate = new Date().toISOString().slice(0, 10);

  const requestCallback = () => {
    if (name.trim().length < 2 || phone.trim().length < 6) {
      toast.error("Indiquez votre nom et un numéro de téléphone valide.");
      return;
    }
    if (!preferredDate) {
      toast.error("Choisissez une date de rappel souhaitée.");
      return;
    }
    const formattedDate = new Date(`${preferredDate}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const message = `Bonjour 3M Travel, je demande un rappel pour la procédure ${procedure} vers ${destination}.\nNom : ${name.trim()}\nTéléphone : ${phone.trim()}\nDate souhaitée : ${formattedDate}\nCréneau souhaité : ${preferredTimeSlot}`;
    window.open(`https://wa.me/237698104832?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 font-bold py-3 rounded-xl shadow-sm">
          <PhoneCall className="w-4 h-4 mr-2" /> Demander un rappel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demander un rappel</DialogTitle>
          <DialogDescription>Un conseiller 3M Travel pourra vous rappeler au sujet de {destination}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="callback-name">Votre nom</Label>
            <Input id="callback-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom et prénom" autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="callback-phone">Numéro à rappeler</Label>
            <Input id="callback-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ex. +237 6XX XXX XXX" inputMode="tel" autoComplete="tel" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="callback-date">Date souhaitée</Label>
              <Input id="callback-date" type="date" min={minimumDate} value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="callback-slot">Créneau souhaité</Label>
              <select id="callback-slot" value={preferredTimeSlot} onChange={(event) => setPreferredTimeSlot(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="09:00–11:00">09:00 – 11:00</option>
                <option value="11:00–13:00">11:00 – 13:00</option>
                <option value="14:00–16:00">14:00 – 16:00</option>
                <option value="16:00–18:00">16:00 – 18:00</option>
              </select>
            </div>
          </div>
          <Button onClick={requestCallback} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            <PhoneCall className="w-4 h-4 mr-2" /> Envoyer ma demande
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
