using Godot;
using Godot.Sharp.Extras;

public class Main : Control
{
    [NodePath] private Label _label;
    
    public override void _Ready()
    {
        this.OnReady();
        GD.Print($"Label: {_label}");
        GD.Print($"Text: {_label.Text}");
        GD.Print("hello");
    }
}
