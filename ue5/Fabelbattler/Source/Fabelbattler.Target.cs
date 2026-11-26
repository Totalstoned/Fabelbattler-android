using UnrealBuildTool;

public class FabelbattlerTarget : TargetRules
{
	public FabelbattlerTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V5;
		ExtraModuleNames.Add("Fabelbattler");
	}
}
