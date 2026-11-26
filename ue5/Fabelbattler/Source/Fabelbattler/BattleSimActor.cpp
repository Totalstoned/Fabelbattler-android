#include "BattleSimActor.h"

#include "UnitActor.h"
#include "Dom/JsonObject.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

ABattleSimActor::ABattleSimActor()
{
	PrimaryActorTick.bCanEverTick = true;
}

void ABattleSimActor::LoadUnitData()
{
	const FString Path = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("Data/units.json"));
	FString Json;
	if (!FFileHelper::LoadFileToString(Json, *Path))
	{
		UE_LOG(LogTemp, Error, TEXT("Fabelbattler: units.json fehlt: %s"), *Path);
		return;
	}

	TSharedPtr<FJsonObject> Root;
	const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
	if (!FJsonSerializer::Deserialize(Reader, Root) || !Root.IsValid())
	{
		UE_LOG(LogTemp, Error, TEXT("Fabelbattler: units.json ist kein gueltiges JSON"));
		return;
	}

	Root->TryGetNumberField(TEXT("human_count"), HumanCount);
	Root->TryGetNumberField(TEXT("monster_count"), MonsterCount);

	const auto ReadKeys = [&Root](const TCHAR* Field, TArray<FString>& Out)
	{
		const TArray<TSharedPtr<FJsonValue>>* Values = nullptr;
		if (Root->TryGetArrayField(Field, Values))
		{
			for (const TSharedPtr<FJsonValue>& Value : *Values)
			{
				FString Key;
				if (Value->TryGetString(Key))
				{
					Out.Add(Key);
				}
			}
		}
	};
	ReadKeys(TEXT("human_keys"), HumanKeys);
	ReadKeys(TEXT("monster_keys"), MonsterKeys);
}

void ABattleSimActor::BeginPlay()
{
	Super::BeginPlay();
	LoadUnitData();
	SpawnWave();
}

void ABattleSimActor::SpawnWave()
{
	const int32 Humans = FMath::Min(24, HumanKeys.Num());
	const int32 Monsters = FMath::Max(1, FMath::Min(12, MonsterKeys.Num()));
	for (int32 i = 0; i < Humans; ++i)
	{
		const FVector At(-700.f + (i % 6) * 90.f, -220.f + (i / 6) * 90.f, 0.f);
		AUnitActor* Unit = GetWorld()->SpawnActor<AUnitActor>(AUnitActor::StaticClass(), At, FRotator::ZeroRotator);
		if (Unit)
		{
			Unit->SetupTeam(true, HumanKeys[i], At);
			Spawned.Add(Unit);
		}
	}
	for (int32 i = 0; i < Monsters; ++i)
	{
		const FVector At(500.f + (i % 4) * 90.f, -140.f + (i / 4) * 90.f, 0.f);
		AUnitActor* Unit = GetWorld()->SpawnActor<AUnitActor>(AUnitActor::StaticClass(), At, FRotator::ZeroRotator);
		if (Unit)
		{
			Unit->SetupTeam(false, MonsterKeys[i], At);
			Spawned.Add(Unit);
		}
	}
	UE_LOG(LogTemp, Warning, TEXT("Fabelbattler Welle %d: %d Menschen gegen %d Monster (Daten: %d/%d)"),
		Wave, Humans, Monsters, HumanCount, MonsterCount);
}

void ABattleSimActor::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	Elapsed += DeltaSeconds;
	if (Elapsed >= WaveDuration)
	{
		Elapsed = 0.f;
		++Wave;
		SpawnWave();
	}
}
